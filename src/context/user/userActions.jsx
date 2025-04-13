import { derivWebSocket } from '../../services/websocket_client';
import { parseDerivAuthTokens } from '../../services/parseDerivAuth';
import { setupWebSocketSubscriptions, authorizeAccount, subscribeToBalance } from './websocketHandlers';

export const userActions = (dispatch, setLoading, setError) => {
  const handleWebSocketMessage = (data) => {
    if (data.error) {
      if (data.error.code === 'InvalidToken') {
        setError('Session expired. Please log in again.');
        dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: null });
        localStorage.removeItem('activeAccountLoginid');
        localStorage.removeItem('derivTokens');
      }
      return;
    }

    if (data.balance?.loginid) {
      dispatch({ 
        type: 'UPDATE_ACCOUNT_DATA', 
        payload: {
          loginid: data.balance.loginid,
          updates: { balance: data.balance.balance }
        }
      });
    }

    if (data.reality_check) {
      dispatch({
        type: 'SET_REALITY_CHECK',
        payload: data.reality_check,
      });
    }

    if (data.statement?.transactions) {
      dispatch({
        type: 'SET_STATEMENTS',
        payload: data.statement.transactions,
      });
    }

    if (data.transaction) {
      dispatch({
        type: 'ADD_TRANSACTION',
        payload: data.transaction,
      });
    }
  };

  const connectWebSocket = async () => {
    let retryCount = 0;
    const maxRetries = 5;
    const baseRetryDelay = 2000;

    const attemptConnection = async () => {
      try {
        if (!derivWebSocket.socket || derivWebSocket.socket.readyState !== WebSocket.OPEN) {
          derivWebSocket.connect();
        }

        await new Promise((resolve, reject) => {
          if (derivWebSocket.socket.readyState === WebSocket.OPEN) {
            resolve();
          } else {
            const unsubscribe = derivWebSocket.subscribe((event, data) => {
              if (event === 'open') resolve();
              else if (event === 'error' || event === 'close') reject();
            });
            return () => unsubscribe();
          }
        });
      } catch (err) {
        if (retryCount < maxRetries) {
          retryCount++;
          await new Promise(resolve => 
            setTimeout(resolve, baseRetryDelay * Math.pow(2, retryCount))
          );
          return attemptConnection();
        }
        throw new Error('Max WebSocket retries reached');
      }
    };

    return attemptConnection();
  };

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);

    try {
      let parsedAccounts = parseDerivAuthTokens();
      if (!parsedAccounts.length) {
        const storedTokens = localStorage.getItem('derivTokens');
        if (storedTokens) parsedAccounts = JSON.parse(storedTokens);
      }

      if (!parsedAccounts.length) {
        throw new Error('No valid tokens found');
      }

      localStorage.setItem('derivTokens', JSON.stringify(parsedAccounts));
      await connectWebSocket();

      parsedAccounts.forEach((account) => {
        authorizeAccount(account.token);
        subscribeToBalance(account.loginid);
      });

      // Subscribe to additional data
      subscribeToRealityCheck();
      subscribeToStatements();
      subscribeToTransactions();
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Invalid token') || err.message.includes('Max WebSocket retries')) {
        localStorage.removeItem('activeAccountLoginid');
        localStorage.removeItem('derivTokens');
        dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: null });
        dispatch({ type: 'SET_ACCOUNTS', payload: { real: [], demo: [] } });
      }
    } finally {
      setLoading(false);
    }
  };

  const switchAccount = async (accountType) => {
    try {
      const state = dispatch.getState();
      const targetAccounts = state.accounts[accountType];
      if (!targetAccounts || targetAccounts.length === 0) {
        throw new Error(`No ${accountType} account available`);
      }

      const newActiveAccount = targetAccounts[0];
      dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: newActiveAccount });
      localStorage.setItem('activeAccountLoginid', newActiveAccount.loginid);

      authorizeAccount(newActiveAccount.token);
      subscribeToBalance(newActiveAccount.loginid);

    } catch (error) {
      setError(`Failed to switch account: ${error.message}`);
    }
  };

  const clearRecentTrades = () => {
    const state = dispatch.getState();
    if (state.activeAccount) {
      const loginid = state.activeAccount.loginid;
      dispatch({ 
        type: 'UPDATE_ACCOUNT_DATA', 
        payload: {
          loginid,
          updates: { recentTrades: [] }
        }
      });
      localStorage.setItem(`recentTrades_${loginid}`, JSON.stringify([]));
    }
  };

  return {
    fetchUserData,
    switchAccount,
    clearRecentTrades,
    handleWebSocketMessage
  };
};