import { createContext, useState, useEffect, useContext } from 'react';
import userData, { realityCheckResponse, statementResponse, transactionResponse } from '../pages/dashboard/data/UserData';
import { derivWebSocket } from '../services/websocket_client'; 

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
  const [accounts, setAccounts] = useState({ real: null, demo: null });
  const [activeAccountType, setActiveAccountType] = useState(null); // 'real' or 'demo'
  const [accountData, setAccountData] = useState({}); // Account-specific data: { [loginid]: { recentTrades, statement, transactions, balance } }
  const [realityCheck, setRealityCheck] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load active account type from localStorage
  useEffect(() => {
    const savedAccountType = localStorage.getItem('activeAccountType');
    if (savedAccountType === 'real' || savedAccountType === 'demo') {
      setActiveAccountType(savedAccountType);
    }
  }, []);

  // Initialize WebSocket and fetch initial data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Parse accounts from userData
        const accountList = userData.account_list || [];
        const realAccount = accountList.find((acc) => acc.is_virtual === 0) || null;
        const demoAccount = accountList.find((acc) => acc.is_virtual === 1) || {
          // Mock demo account if not present in example
          account_type: 'trading',
          created_at: 1664132232,
          currency: 'USD',
          is_disabled: 0,
          is_virtual: 1,
          landing_company_name: 'svg',
          loginid: 'VRTC1859315',
          trading: {},
        };

        const newAccounts = {
          real: realAccount
            ? {
                loginid: realAccount.loginid,
                currency: realAccount.currency,
                balance: realAccount.loginid === userData.loginid ? userData.balance : 0, // Use provided balance for active loginid
                created_at: realAccount.created_at,
              }
            : null,
          demo: demoAccount
            ? {
                loginid: demoAccount.loginid,
                currency: demoAccount.currency,
                balance: 10000, // Mock demo balance; replace with API data
                created_at: demoAccount.created_at,
              }
            : null,
        };

        setAccounts(newAccounts);

        // Initialize account-specific data
        const initialAccountData = {};
        if (newAccounts.real) {
          initialAccountData[newAccounts.real.loginid] = {
            recentTrades: JSON.parse(localStorage.getItem(`recentTrades_${newAccounts.real.loginid}`)) || [],
            statement: statementResponse,
            transactions: transactionResponse,
            balance: newAccounts.real.balance,
          };
        }
        if (newAccounts.demo) {
          initialAccountData[newAccounts.demo.loginid] = {
            recentTrades: JSON.parse(localStorage.getItem(`recentTrades_${newAccounts.demo.loginid}`)) || [],
            statement: statementResponse, // Replace with demo-specific data if available
            transactions: transactionResponse,
            balance: newAccounts.demo.balance,
          };
        }
        setAccountData(initialAccountData);

        // Set default active account
        if (!activeAccountType) {
          const defaultType = newAccounts.demo ? 'demo' : 'real';
          setActiveAccountType(defaultType);
          localStorage.setItem('activeAccountType', defaultType);
        }

        // Set reality check (shared across accounts)
        setRealityCheck(realityCheckResponse);
      } catch (error) {
        console.error('Error processing user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // WebSocket subscriptions
    const unsubscribe = derivWebSocket.subscribe((event, data) => {
      if (event === 'message') {
        handleWebSocketMessage(data);
      }
    });

    // Request initial data for active account
    if (activeAccountType && accounts[activeAccountType]) {
      subscribeToAccountData(accounts[activeAccountType].loginid);
    }

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update WebSocket subscriptions when active account changes
  useEffect(() => {
    if (activeAccountType && accounts[activeAccountType]) {
      subscribeToAccountData(accounts[activeAccountType].loginid);
    }
  }, [accounts, activeAccountType]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    if (data.error) {
      console.error('WebSocket error:', data.error);
      return;
    }

    const loginid = activeAccountType && accounts[activeAccountType]?.loginid;

    if (data.balance) {
      setAccountData((prev) => ({
        ...prev,
        [loginid]: {
          ...prev[loginid],
          balance: data.balance.balance,
        },
      }));
    }

    if (data.transaction) {
      const newTrade = {
        id: data.transaction.id,
        type: data.transaction.action,
        amount: Math.abs(data.transaction.amount),
        profit: data.transaction.amount > 0 ? data.transaction.amount : 0,
        symbol: data.transaction.symbol || 'N/A',
        time: new Date(data.transaction.purchase_time * 1000).toLocaleString(),
      };

      setAccountData((prev) => {
        const updatedTrades = [newTrade, ...(prev[loginid]?.recentTrades || []).slice(0, 4)];
        localStorage.setItem(`recentTrades_${loginid}`, JSON.stringify(updatedTrades));
        return {
          ...prev,
          [loginid]: {
            ...prev[loginid],
            recentTrades: updatedTrades,
          },
        };
      });
    }

    if (data.statement) {
      setAccountData((prev) => ({
        ...prev,
        [loginid]: {
          ...prev[loginid],
          statement: data.statement,
        },
      }));
    }
  };

  // Subscribe to account-specific data
  const subscribeToAccountData = (loginid) => {
    // Request balance
    derivWebSocket.send({
      balance: 1,
      account: loginid,
      subscribe: 1,
    });

    // Request transactions
    derivWebSocket.send({
      transaction: 1,
      account: loginid,
      subscribe: 1,
    });

    // Request statement
    derivWebSocket.send({
      statement: 1,
      account: loginid,
      limit: 100,
      subscribe: 1,
    });
  };

  // Switch active account
  const switchAccount = (accountType) => {
    if (accountType === 'real' || accountType === 'demo') {
      setActiveAccountType(accountType);
      localStorage.setItem('activeAccountType', accountType);
    }
  };

  // Clear recent trades for the active account
  const clearRecentTrades = () => {
    const loginid = activeAccountType && accounts[activeAccountType]?.loginid;
    if (loginid) {
      setAccountData((prev) => {
        const updatedData = {
          ...prev,
          [loginid]: {
            ...prev[loginid],
            recentTrades: [],
          },
        };
        localStorage.setItem(`recentTrades_${loginid}`, JSON.stringify([]));
        return updatedData;
      });
    }
  };

  // Get active account
  const activeAccount = activeAccountType ? accounts[activeAccountType] : null;
  const activeAccountData = activeAccount ? accountData[activeAccount.loginid] || {} : {};

  return (
    <UserContext.Provider
      value={{
        user: activeAccount, // Backward compatibility
        accounts,
        activeAccountType,
        switchAccount,
        realityCheck,
        statement: activeAccountData.statement,
        transactions: activeAccountData.transactions,
        recentTrades: activeAccountData.recentTrades || [],
        balance: activeAccountData.balance,
        clearRecentTrades,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};