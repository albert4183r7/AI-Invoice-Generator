import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const AuthContext = createContext();

// The provider and its consumer hook intentionally live together -- every
// call site imports `useAuth` from this module, and splitting them apart would
// mean touching nine files to satisfy an HMR-only lint rule.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // The only source of truth for "am I signed in" is the server, because the
  // session lives in an httpOnly cookie that JavaScript cannot read. Reading
  // two localStorage keys and calling that authenticated -- which is what this
  // used to do -- meant a stale 30-day token left the user looking at a
  // signed-in shell that failed every request.
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch {
      // A 401 here is the normal "not signed in" answer, not an error worth
      // reporting.
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = (userData) => {
    // The cookie is already set by the server on the same response; there is
    // no token to store.
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await axiosInstance.post(API_PATHS.AUTH.LOGOUT);
    } catch {
      // Clearing the client session matters more than the round trip
      // succeeding, so a failure here is not worth blocking on.
    }

    setUser(null);
    setIsAuthenticated(false);
    window.location.href = "/";
  };

  const updateUser = (updatedUserData) => {
    setUser((prev) => ({ ...prev, ...updatedUserData }));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
