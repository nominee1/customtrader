import React, { createContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async () => {
    // Implement your login logic here
    // Call Deriv API authentication
    // On success:
    setUser({ name: 'User', token: 'sample-token' });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth has been moved to a separate file for Fast Refresh compatibility.