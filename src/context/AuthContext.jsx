import { createContext, useState, useEffect, useContext } from 'react';
import { derivWebSocket } from '../services/websocket_client';
import { parseDerivAuthTokens } from '../services/parseDerivAuth';

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
    const baseRetryDelay = 2000; // 2 seconds

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
        // Parse tokens from URL
        let parsedAccounts = parseDerivAuthTokens();
        console.log('📌 Parsed accounts from URL:', parsedAccounts);

        // Fallback to localStorage if URL tokens are empty
        if (!parsedAccounts.length) {
          const storedTokens = localStorage.getItem('derivTokens');
          if (storedTokens) {
            parsedAccounts = JSON.parse(storedTokens);
            console.log('📌 Loaded accounts from localStorage:', parsedAccounts);
          }
        }

        if (!parsedAccounts.length) {
          throw new Error('No valid tokens found in URL or localStorage');
        }

        // Store tokens temporarily in local storage
        localStorage.setItem('derivTokens', JSON.stringify(parsedAccounts));
        console.log('📌 Stored tokens in localStorage for fallback');

        // Connect WebSocket
        await connectWebSocket();

        // Select default account (USD priority or first)
        const defaultAccount = parsedAccounts.find((acc) => acc.currency === 'USD') || parsedAccounts[0];
        console.log('📌 Selected default account:', defaultAccount);

        // Authenticate with default account token
        const authResponse = await new Promise((resolve, reject) => {
          const unsubscribe = derivWebSocket.subscribe((event, data) => {
            if (event === 'message' && data.authorize) {
              console.log('📌 Authorization response:', data);
              if (data.error) {
                console.error('📌 Authorization error:', data.error);
                reject(new Error(data.error.message));
              } else {
                resolve(data.authorize);
              }
              unsubscribers.push(unsubscribe);
            }
          });
          unsubscribers.push(unsubscribe);

          console.log('📌 Sending authorize request:', { authorize: defaultAccount.token });
          derivWebSocket.send({ authorize: defaultAccount.token });
        });

        // Process accounts
        const accountList = authResponse.account_list || [];
        console.log('📌 Fetched account list:', accountList);

        const newAccounts = { real: [], demo: [] };
        const initialAccountData = {};

        parsedAccounts.forEach((parsedAcc) => {
          const apiAccount = accountList.find((apiAcc) => apiAcc.loginid === parsedAcc.loginid);
          if (apiAccount) {
            const accountType = apiAccount.is_virtual ? 'demo' : 'real';
            const account = {
              loginid: apiAccount.loginid,
              currency: apiAccount.currency,
              balance: apiAccount.balance || 0,
              created_at: apiAccount.created_at || Math.floor(Date.now() / 1000),
              token: parsedAcc.token,
            };
            newAccounts[accountType].push(account);

            initialAccountData[apiAccount.loginid] = {
              balance: apiAccount.balance || 0,
              recentTrades: JSON.parse(localStorage.getItem(`recentTrades_${apiAccount.loginid}`)) || [],
              statement: null,
              transactions: null,
            };

            console.log(`📌 Processed ${accountType} account:`, account);
          }
        });

        console.log('📌 Updated accounts state:', newAccounts);
        setAccounts(newAccounts);
        console.log('📌 Updated accountData state:', initialAccountData);
        setAccountData(initialAccountData);

        // Set active account
        const active = newAccounts.real.find((acc) => acc.loginid === defaultAccount.loginid) ||
                       newAccounts.demo.find((acc) => acc.loginid === defaultAccount.loginid);
        if (active) {
          console.log('📌 Setting active account:', active);
          setActiveAccount(active);
          localStorage.setItem('activeAccountLoginid', active.loginid);
        } else {
          console.warn('📌 No matching active account found for default:', defaultAccount.loginid);
        }

        // Subscribe to balance for all accounts
        [...newAccounts.real, ...newAccounts.demo].forEach((account) => {
          console.log(`📌 Subscribing to balance for account: ${account.loginid}`);
          derivWebSocket.send({
            balance: 1,
            account: account.loginid,
            subscribe: 1,
          });
        });

      } catch (err) {
        console.error('📌 Error fetching user data:', err.message);
        setError(err.message);
        if (err.message.includes('Invalid token') || err.message.includes('Max WebSocket retries')) {
          console.warn('📌 Clearing state due to error');
          localStorage.removeItem('activeAccountLoginid');
          localStorage.removeItem('derivTokens');
          setActiveAccount(null);
          setAccounts({ real: [], demo: [] });
        }
      } finally {
        console.log('📌 Fetch user data completed, loading:', false);
        setLoading(false);
      }
    };

    fetchUserData();

    // WebSocket message handler
    const messageUnsubscribe = derivWebSocket.subscribe((event, data) => {
      if (event === 'message') {
        handleWebSocketMessage(data);
      }
    });
    unsubscribers.push(messageUnsubscribe);

    return () => {
      console.log('📌 Cleaning up: Unsubscribing from WebSocket');
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    console.log('📌 Received WebSocket message:', data);

    if (data.error) {
      console.error('📌 WebSocket error:', data.error);
      if (data.error.code === 'InvalidToken') {
        console.warn('📌 Invalid token detected, session expired');
        setError('Session expired. Please log in again.');
        setActiveAccount(null);
        localStorage.removeItem('activeAccountLoginid');
        localStorage.removeItem('derivTokens');
      }
      return;
    }

    if (data.balance) {
      console.log(`📌 Balance update for account ${data.balance.account}:`, {
        balance: data.balance.balance,
        currency: data.balance.currency,
      });
      setAccountData((prev) => ({
        ...prev,
        [data.balance.account]: {
          ...prev[data.balance.account],
          balance: data.balance.balance,
        },
      }));
    }
  };

  // Switch active account
  const switchAccount = (loginid) => {
    const account = [...accounts.real, ...accounts.demo].find((acc) => acc.loginid === loginid);
    if (account) {
      console.log('📌 Switching to account:', account);
      setActiveAccount(account);
      localStorage.setItem('activeAccountLoginid', loginid);

      console.log('📌 Sending authorize request for account switch:', { authorize: account.token });
      derivWebSocket.send({ authorize: account.token });
    } else {
      console.warn('📌 Account not found for loginid:', loginid);
    }
  };

  // Clear recent trades
  const clearRecentTrades = () => {
    if (activeAccount) {
      console.log('📌 Clearing recent trades for account:', activeAccount.loginid);
      setAccountData((prev) => {
        const updatedData = {
          ...prev,
          [activeAccount.loginid]: {
            ...prev[activeAccount.loginid],
            recentTrades: [],
          },
        };
        localStorage.setItem(`recentTrades_${activeAccount.loginid}`, JSON.stringify([]));
        return updatedData;
      });
    }
  };

  return (
    <UserContext.Provider
      value={{
        user: activeAccount,
        accounts,
        activeAccount,
        switchAccount,
        realityCheck: null,
        statement: activeAccount ? accountData[activeAccount.loginid]?.statement : null,
        transactions: activeAccount ? accountData[activeAccount.loginid]?.transactions : null,
        recentTrades: activeAccount ? accountData[activeAccount.loginid]?.recentTrades || [] : [],
        balance: activeAccount ? accountData[activeAccount.loginid]?.balance : 0,
        clearRecentTrades,
        loading,
        error,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};