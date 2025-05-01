import { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { derivWebSocket } from '../services/websocket_client';
import Notification from '../utils/Notification';
import { getTokens } from '../api/getTokens';

const UserContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [accounts, setAccounts] = useState({ real: [], demo: [] });
  const [activeAccount, setActiveAccount] = useState(null);
  const [accountData, setAccountData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [notification, setNotification] = useState({ type: '', content: '', trigger: false });

  const activeAccountType = useMemo(() => (activeAccount?.is_virtual ? 'demo' : 'real'), [activeAccount]);

  const showNotification = (type, content) => {
    setNotification({ type, content, trigger: true });
    setTimeout(() => setNotification((prev) => ({ ...prev, trigger: false })), 3000);
  };

  useEffect(() => {
    let unsubscribers = [];
    let retryCount = 0;
    const maxRetries = 5;
    const baseRetryDelay = 2000;

    const connectWebSocket = async () => {
      try {
        if (!derivWebSocket.isConnected()) {
          console.log('Connecting to Deriv WebSocket...');
          await derivWebSocket.connect();
          console.log('WebSocket connected.');
        }
      } catch (err) {
        console.error('WebSocket connection failed:', err.message);
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = baseRetryDelay * Math.pow(2, retryCount);
          console.log(`Retrying WebSocket connection in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return connectWebSocket();
        }
        throw new Error('Max WebSocket retries reached');
      }
    };

    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      setIsAuthorized(false);

      try {
        const sessionToken = sessionStorage.getItem('sessionToken');
        if (!sessionToken) throw new Error('Not authenticated');

        console.log('Fetching tokens with sessionToken:', sessionToken);
        const response = await getTokens();
        const data = await response.json();
        console.log('Tokens fetched:', data);

        if (!data.accounts || !data.accounts.length) throw new Error('No tokens found');

        const parsedAccounts = data.accounts; // Array of { loginid, token, currency }

        await connectWebSocket();

        const accountAuthArrays = await Promise.all(
          parsedAccounts.map((acc) => {
            return new Promise((resolve) => {
              console.log(`Authorizing token for loginid: ${acc.loginid}`);
              const unsubscribe = derivWebSocket.subscribe((event, data) => {
                if (event === 'message' && data.authorize) {
                  console.log(`Authorization successful for ${acc.loginid}:`, data.authorize);
                  const accountsFromList = data.authorize.account_list || [];
                  const mappedAccounts = accountsFromList.map((accInfo) => ({
                    token: acc.token,
                    loginid: accInfo.loginid,
                    currency: accInfo.currency,
                    is_virtual: accInfo.is_virtual,
                    balance: accInfo.loginid === data.authorize.loginid ? data.authorize.balance : 0,
                    email: data.authorize.email,
                    fullname: data.authorize.fullname,
                    country: data.authorize.country,
                    landing_company_fullname: data.authorize.landing_company_fullname,
                    raw: accInfo,
                  }));
                  unsubscribe();
                  resolve(mappedAccounts);
                } else if (event === 'message' && data.error) {
                  console.error(`Authorization failed for token ${acc.loginid}:`, data.error.message);
                  unsubscribe();
                  resolve(null);
                }
              });
              derivWebSocket.send({ authorize: acc.token });
            });
          })
        );

        const accountAuths = accountAuthArrays.flat();
        const validAccounts = accountAuths.filter(Boolean);
        if (!validAccounts.length) {
          throw new Error('No valid accounts could be authorized. Please log in again.');
        }

        const newAccounts = { real: [], demo: [] };
        const initialAccountData = {};

        validAccounts.forEach((account) => {
          const type = account.is_virtual ? 'demo' : 'real';
          newAccounts[type].push(account);
          initialAccountData[account.loginid] = {
            balance: account.balance,
            statement: null,
            transactions: null,
            profile: account.raw,
          };
        });

        const tokenMap = {};
        parsedAccounts.forEach((acc) => {
          tokenMap[acc.loginid] = acc.token;
        });
        sessionStorage.setItem('derivLoginTokenMap', JSON.stringify(tokenMap));

        setAccounts(newAccounts);
        setAccountData(initialAccountData);

        const savedLoginid = sessionStorage.getItem('activeAccountLoginid');
        let defaultAccount = validAccounts.find((acc) => acc.loginid === savedLoginid);
        if (!defaultAccount) {
          defaultAccount =
            newAccounts.real.find((acc) => acc.currency === 'USD') ||
            newAccounts.real[0] ||
            newAccounts.demo[0];
        }

        if (defaultAccount) {
          setActiveAccount(defaultAccount);
          sessionStorage.setItem('activeAccountLoginid', defaultAccount.loginid);

          await new Promise((resolve, reject) => {
            const unsubscribe = derivWebSocket.subscribe((event, data) => {
              if (event === 'message' && data.authorize) {
                console.log(`Default account authorized: ${defaultAccount.loginid}`);
                setIsAuthorized(true);
                unsubscribe();
                resolve();
              } else if (event === 'message' && data.error) {
                console.error('Default account authorization error:', data.error);
                unsubscribe();
                reject(new Error(data.error.message));
              }
            });
            derivWebSocket.send({ authorize: defaultAccount.token });
          });
        }

        validAccounts.forEach((account) => {
          console.log(`Subscribing to balance for ${account.loginid}`);
          derivWebSocket.send({ balance: 1, account: account.loginid, subscribe: 1 });
        });
      } catch (err) {
        console.error('Error fetching user data:', err.message);
        showNotification('error', err.message);
        setError(err.message);
        if (err.message.includes('Invalid token') || err.message.includes('Max WebSocket retries')) {
          sessionStorage.removeItem('activeAccountLoginid');
          sessionStorage.removeItem('derivLoginTokenMap');
          setActiveAccount(null);
          setAccounts({ real: [], demo: [] });
          setIsAuthorized(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    const messageUnsubscribe = derivWebSocket.subscribe((event, data) => {
      if (event === 'message') handleWebSocketMessage(data);
    });
    unsubscribers.push(messageUnsubscribe);

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const handleWebSocketMessage = (data) => {
    if (data.error) {
      console.error('WebSocket error:', data.error);
      if (data.error.code === 'InvalidToken') {
        setError('Session expired. Please log in again.');
        setActiveAccount(null);
        setIsAuthorized(false);
        sessionStorage.removeItem('activeAccountLoginid');
        sessionStorage.removeItem('derivLoginTokenMap');
      }
      return;
    }

    if (data.balance && data.balance.loginid) {
      setAccountData((prev) => {
        const loginid = data.balance.loginid;
        const existing = prev[loginid] || {};
        return {
          ...prev,
          [loginid]: {
            ...existing,
            balance: data.balance.balance,
          },
        };
      });
    }
  };

  const sendAuthorizedRequest = async (payload) => {
    return new Promise((resolve, reject) => {
      if (!activeAccount?.token) {
        return reject(new Error('No active account or token available.'));
      }

      if (!derivWebSocket.isConnected()) {
        return reject(new Error('WebSocket connection is not open.'));
      }

      const authUnsubscribe = derivWebSocket.subscribe((event, data) => {
        if (event === 'message' && data.authorize) {
          authUnsubscribe();
          setIsAuthorized(true);

          const reqId = payload.req_id || Math.floor(Math.random() * 1e15);
          const messageUnsubscribe = derivWebSocket.subscribe((event, response) => {
            if (event === 'message' && response.req_id === reqId) {
              messageUnsubscribe();
              if (response.error) {
                reject(response.error);
              } else {
                resolve(response);
              }
            }
          });

          derivWebSocket.send({ ...payload, req_id: reqId });
        } else if (event === 'message' && data.error) {
          authUnsubscribe();
          setIsAuthorized(false);
          reject(data.error);
        }
      });
      derivWebSocket.send({ authorize: activeAccount.token });
    });
  };

  const switchAccount = async (accountType) => {
    try {
      const targetAccounts = accounts[accountType];
      if (!targetAccounts || targetAccounts.length === 0) {
        throw new Error(`No ${accountType} account available to switch.`);
      }

      const newActiveAccount = targetAccounts[0];
      const loginTokenMap = JSON.parse(sessionStorage.getItem('derivLoginTokenMap') || '{}');
      const token = loginTokenMap[newActiveAccount.loginid];
      if (!token) throw new Error('Missing token for selected account.');
      setActiveAccount(newActiveAccount);
      setIsAuthorized(false);
      sessionStorage.setItem('activeAccountLoginid', newActiveAccount.loginid);

      await new Promise((resolve, reject) => {
        const unsubscribe = derivWebSocket.subscribe((event, data) => {
          if (event === 'message') {
            if (data.authorize && data.authorize.loginid === newActiveAccount.loginid) {
              setAccountData((prev) => ({
                ...prev,
                [newActiveAccount.loginid]: {
                  ...prev[newActiveAccount.loginid],
                  balance: data.authorize.balance,
                  profile: data.authorize,
                },
              }));
              setIsAuthorized(true);
              unsubscribe();
              resolve();
            } else if (data.error) {
              console.error('Authorization error:', data.error);
              setIsAuthorized(false);
              unsubscribe();
              reject(new Error(data.error.message));
            }
          }
        });
        derivWebSocket.send({ authorize: token });
      });

      derivWebSocket.send({
        balance: 1,
        account: newActiveAccount.loginid,
        subscribe: 1,
      });
    } catch (error) {
      console.error('Error switching account:', error.message);
      showNotification('error', `Failed to switch account: ${error.message}`);
      setError(`Failed to switch account: ${error.message}`);
      throw error;
    }
  };

  const contextValue = {
    user: activeAccount,
    accounts,
    activeAccount,
    activeAccountType,
    switchAccount,
    accountData: activeAccount ? accountData[activeAccount.loginid] : {},
    balance: activeAccount ? accountData[activeAccount.loginid]?.balance : 0,
    loading,
    error,
    isAuthorized,
    realityChecks: activeAccount ? accountData[activeAccount.loginid]?.realityChecks : {},
    sendAuthorizedRequest,
  };

  return (
    <UserContext.Provider value={contextValue}>
      <Notification type={notification.type} content={notification.content} trigger={notification.trigger} />
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;