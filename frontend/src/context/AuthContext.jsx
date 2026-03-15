import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI, watchlistAPI, tradesAPI } from "../api/index.js";

const AuthContext = createContext(null);

// DATA MODE: "live" = Yahoo Finance, "mock" = simulated prices (works when market is closed)
const DATA_MODE_KEY = "am_data_mode";

export const AuthProvider = ({ children }) => {
  const [user,         setUser]         = useState(null);
  const [balance,      setBalance]      = useState(0);
  const [watchlist,    setWatchlist]    = useState([]);
  const [notification, setNotification] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [dataMode,     setDataMode]     = useState(
    () => localStorage.getItem(DATA_MODE_KEY) || "mock"
  );

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem("am_token");
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(({ user }) => {
        setUser(user);
        setBalance(user.balance);
        setWatchlist(user.watchlist || []);
      })
      .catch(() => localStorage.removeItem("am_token"))
      .finally(() => setLoading(false));
  }, []);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // Toggle live ↔ mock data mode
  const toggleDataMode = useCallback(() => {
    setDataMode((prev) => {
      const next = prev === "live" ? "mock" : "live";
      localStorage.setItem(DATA_MODE_KEY, next);
      return next;
    });
  }, []);

  const setDataModeDirectly = useCallback((mode) => {
    localStorage.setItem(DATA_MODE_KEY, mode);
    setDataMode(mode);
  }, []);

  // Auth
  const login = async (email, password) => {
    try {
      const { token, user } = await authAPI.login(email, password);
      localStorage.setItem("am_token", token);
      setUser(user);
      setBalance(user.balance);
      setWatchlist(user.watchlist || []);
      return { success: true, role: user.role };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const { token, user } = await authAPI.signup(name, email, password);
      localStorage.setItem("am_token", token);
      setUser(user);
      setBalance(user.balance);
      setWatchlist([]);
      return { success: true, role: user.role };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null); setBalance(0); setWatchlist([]);
    localStorage.removeItem("am_token");
  };

  // Update profile (name, email, password, balance, avatarColor)
  const updateProfile = async (data) => {
    try {
      const { user: updated } = await authAPI.updateProfile(data);
      setUser(updated);
      setBalance(updated.balance);
      showNotification("Profile updated successfully!", "success");
      return { success: true };
    } catch (err) {
      showNotification(err.message, "error");
      return { success: false, error: err.message };
    }
  };

  // Reset portfolio (wipe trades + positions, restore balance)
  const resetPortfolio = async (newBalance) => {
    try {
      const { balance: b } = await authAPI.resetPortfolio(newBalance);
      setBalance(b);
      const { user: updated } = await authAPI.me();
      setUser(updated);
      showNotification("Portfolio reset! Fresh start with ₹" + b.toLocaleString("en-IN"), "success");
      return { success: true };
    } catch (err) {
      showNotification(err.message, "error");
      return { success: false, error: err.message };
    }
  };

  // Watchlist
  const addToWatchlist = async (symbol) => {
    if (watchlist.includes(symbol)) return;
    try {
      const { watchlist: updated } = await watchlistAPI.add(symbol);
      setWatchlist(updated);
      showNotification(`${symbol} added to watchlist`, "success");
    } catch (err) { showNotification(err.message, "error"); }
  };

  const removeFromWatchlist = async (symbol) => {
    try {
      const { watchlist: updated } = await watchlistAPI.remove(symbol);
      setWatchlist(updated);
      showNotification(`${symbol} removed from watchlist`, "info");
    } catch (err) { showNotification(err.message, "error"); }
  };

  // Execute trade
  const executeTrade = async (symbol, type, qty, price, name = "", orderType = "MARKET", sector = "") => {
    try {
      const { balance: newBalance } = await tradesAPI.execute(symbol, name, type, qty, price, orderType, sector);
      setBalance(newBalance);
      showNotification(
        `${type} ${qty} × ${symbol} @ ₹${price.toLocaleString("en-IN")} executed!`, "success"
      );
      return true;
    } catch (err) {
      showNotification(err.message, "error");
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, balance, watchlist, notification, loading,
      dataMode, toggleDataMode, setDataModeDirectly,
      login, signup, logout,
      updateProfile, resetPortfolio,
      addToWatchlist, removeFromWatchlist,
      showNotification, executeTrade,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
