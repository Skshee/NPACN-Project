import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check URL parameters for OAuth2 login redirect
    const urlParams = new URLSearchParams(window.location.search);
    const oauthUsername = urlParams.get('oauth_username');
    
    if (oauthUsername) {
      setUser({ username: oauthUsername });
      localStorage.setItem('username', oauthUsername);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedUsername = localStorage.getItem('username');
      if (savedUsername) {
        setUser({ username: savedUsername });
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser({ username: userData.username });
    localStorage.setItem('username', userData.username);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('username');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

