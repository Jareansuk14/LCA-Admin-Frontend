import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = authAPI.getToken();
    const userData = authAPI.getCurrentUser();
    
    if (token && userData) {
      // Try to refresh user data from server to get latest team info
      authAPI.getMe()
        .then((response) => {
          if (response.success && response.user) {
            // Update localStorage with fresh user data
            localStorage.setItem('user', JSON.stringify(response.user));
            setUser(response.user);
          } else {
            // Fallback to stored user data
            setUser(userData);
          }
        })
        .catch((error) => {
          console.error('Failed to refresh user data:', error);
          // Fallback to stored user data
          setUser(userData);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        // Store token and user data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setUser(response.user);
        return { success: true, user: response.user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      return { success: false, message };
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user && authAPI.isAuthenticated();
  };

  const isAdmin = () => {
    return user?.role === 'Admin';
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
