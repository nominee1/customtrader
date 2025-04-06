// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authorize, login } from '../services/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on initial load
    const token = localStorage.getItem('deriv_token');
    if (token) {
      authorize(token)
        .then((response) => {
          setUser(response.authorize);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const signIn = async (credentials) => {
    const response = await login(credentials);
    localStorage.setItem('deriv_token', response.authorize.token);
    setUser(response.authorize);
    return response;
  };

  const signOut = () => {
    localStorage.removeItem('deriv_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}