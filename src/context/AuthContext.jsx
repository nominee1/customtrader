import { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { derivWebSocket } from '../services/websocket_client';
import { parseDerivAuthTokens } from '../services/parseDerivAuth';

const UserContext = createContext();

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

  // Derived state
  const activeAccountType = useMemo(() => 
    activeAccount?.is_virtual ? 'demo' : 'real', 
  [activeAccount]);

  // Load active account from localStorage
  useEffect(() => {
    const savedLoginid = localStorage.getItem('activeAccountLoginid');
    if (savedLoginid) {
      console.log('📌 Loaded active account loginid from localStorage:', savedLoginid);
    }
  }, []);

  // Initialize WebSocket and fetch user data
  useEffect(() => {
    let unsubscribers = [];
    let retryCount = 0;
    const maxRetries = 5;
    const baseRetryDelay = 2000;

    const connectWebSocket = async () => {
      try {
        if (!derivWebSocket.socket || derivWebSocket.socket.readyState !== WebSocket.OPEN) {
          console.log('📌 Attempting WebSocket connection, attempt:', retryCount + 1);
          derivWebSocket.connect();
        }

        await new Promise((resolve, reject) => {
          if (derivWebSocket.socket.readyState === WebSocket.OPEN) {
            console.log('📌 WebSocket already open');
            resolve();
          } else {
            const unsubscribe = derivWebSocket.subscribe((event, data) => {
              if (event === 'open') {
                console.log('📌 WebSocket connection opened');
                retryCount = 0;
                resolve();
              } else if (event === 'error') {
                console.error('📌 WebSocket connection error:', data);
                reject(new Error('WebSocket connection failed'));
              } else if (event === 'close') {
                console.log('📌 WebSocket closed unexpectedly');
                reject(new Error('WebSocket closed'));
              }
            });
            unsubscribers.push(unsubscribe);
          }
        });
      } catch (err) {
        console.error('📌 WebSocket connection failed:', err.message);
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = baseRetryDelay * Math.pow(2, retryCount);
          console.log(`📌 Retrying WebSocket connection in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return connectWebSocket();
        }
        throw new Error('Max WebSocket retries reached');
      }
    };

    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Parse tokens from URL or localStorage
        let parsedAccounts = parseDerivAuthTokens();
        if (!parsedAccounts.length) {
          const storedTokens = localStorage.getItem('derivTokens');
          if (storedTokens) parsedAccounts = JSON.parse(storedTokens);
        }

        if (!parsedAccounts.length) {
          throw new Error('No valid tokens found in URL or localStorage');
        }

        localStorage.setItem('derivTokens', JSON.stringify(parsedAccounts));

        // Connect WebSocket
        await connectWebSocket();

        // Authorize accounts
        const accountAuthArrays = await Promise.all(
          parsedAccounts.map((acc) => {
            return new Promise((resolve) => {
              const unsubscribe = derivWebSocket.subscribe((event, data) => {
                if (event === 'message' && data.authorize) {
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
                  unsubscribers.push(unsubscribe);
                  resolve(mappedAccounts);
                } else if (event === 'message' && data.error) {
                  unsubscribers.push(unsubscribe);
                  resolve(null);
                }
              });
              derivWebSocket.send({ authorize: acc.token });
            });
          })
        );
        const accountAuths = accountAuthArrays.flat();

        const validAccounts = accountAuths.filter(Boolean);
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

        setAccounts(newAccounts);
        setAccountData(initialAccountData);

        // Select active account (prefer real, then demo, then first available)
        const defaultAccount = 
          newAccounts.real.find(acc => acc.currency === 'USD') || 
          newAccounts.real[0] || 
          newAccounts.demo[0];

        if (defaultAccount) {
          setActiveAccount(defaultAccount);
          localStorage.setItem('activeAccountLoginid', defaultAccount.loginid);
        }

        // Subscribe to balance updates
        validAccounts.forEach((account) => {
          derivWebSocket.send({ balance: 1, account: account.loginid, subscribe: 1 });
        });

      } catch (err) {
        console.error('📌 Error fetching user data:', err.message);
        setError(err.message);
        if (err.message.includes('Invalid token') || err.message.includes('Max WebSocket retries')) {
          localStorage.removeItem('activeAccountLoginid');
          localStorage.removeItem('derivTokens');
          setActiveAccount(null);
          setAccounts({ real: [], demo: [] });
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
      console.error('📌 WebSocket error:', data.error);
      if (data.error.code === 'InvalidToken') {
        setError('Session expired. Please log in again.');
        setActiveAccount(null);
        localStorage.removeItem('activeAccountLoginid');
        localStorage.removeItem('derivTokens');
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

      // Authorize the active account before sending
      const authUnsubscribe = derivWebSocket.subscribe((event, data) => {
        if (event === 'message' && data.authorize) {
          authUnsubscribe();

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
      setActiveAccount(newActiveAccount);
      localStorage.setItem('activeAccountLoginid', newActiveAccount.loginid);

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
          } else if (data.balance && data.balance.account === newActiveAccount.loginid) {
            setAccountData((prev) => ({
              ...prev,
              [newActiveAccount.loginid]: {
                ...prev[newActiveAccount.loginid],
                balance: data.balance.balance,
              },
            }));
          }
        }
      });

      derivWebSocket.send({ authorize: newActiveAccount.token });

      derivWebSocket.send({
        balance: 1,
        account: newActiveAccount.loginid,
        subscribe: 1,
      });

    } catch (error) {
      console.error('📌 Error switching account:', error.message);
      setError(`Failed to switch account: ${error.message}`);
      alert(`Failed to switch account: ${error.message}`);
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
    realityChecks: activeAccount ? accountData[activeAccount.loginid]?.realityChecks : {},
    sendAuthorizedRequest, // 👈 Add this line
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};