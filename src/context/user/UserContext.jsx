import { createContext } from 'react';
import { useUserReducer } from './userReducers';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const {
    state,
    actions,
    loading,
    error
  } = useUserReducer();

  const value = {
    ...state,
    ...actions,
    loading,
    error,
    realityCheck: state.realityCheck,
    statements: state.statements,
    transactions: state.transactions,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};