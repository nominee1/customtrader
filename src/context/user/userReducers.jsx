import { useReducer, useEffect, useMemo } from 'react';
import { userActions } from './userActions';

const initialState = {
  accounts: { real: [], demo: [] },
  activeAccount: null,
  accountData: {},
};

function userReducer(state, action) {
  switch (action.type) {
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'SET_ACTIVE_ACCOUNT':
      return { ...state, activeAccount: action.payload };
    case 'UPDATE_ACCOUNT_DATA':
      if (action.payload.loginid) {
        return {
          ...state,
          accountData: {
            ...state.accountData,
            [action.payload.loginid]: {
              ...state.accountData[action.payload.loginid],
              ...action.payload.updates
            }
          }
        };
      }
      return {
        ...state,
        accountData: action.payload
      };
    case 'SET_REALITY_CHECK':
      return { ...state, realityCheck: action.payload };
    case 'SET_STATEMENTS':
      return { ...state, statements: action.payload };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [...(state.transactions || []), action.payload],
      };
    default:
      return state;
  }
}

export const useUserReducer = () => {
  const [state, dispatch] = useReducer(userReducer, initialState, () => {
    const savedLoginid = localStorage.getItem('activeAccountLoginid');
    return {
      ...initialState,
      activeAccount: savedLoginid ? { loginid: savedLoginid } : null
    };
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const actions = useMemo(() => 
    userActions(dispatch, setLoading, setError), 
    [dispatch]
  );

  useEffect(() => {
    const unsubscribe = setupWebSocketSubscriptions(actions.handleWebSocketMessage);
    actions.fetchUserData();
    return () => unsubscribe();
  }, [actions]);

  return {
    state,
    actions,
    loading,
    error
  };
};