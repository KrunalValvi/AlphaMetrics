import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

import AuthPage       from "./pages/AuthPage.jsx";
import Dashboard      from "./pages/user/Dashboard.jsx";
import Watchlist      from "./pages/user/Watchlist.jsx";
import Portfolio      from "./pages/user/Portfolio.jsx";
import Orders         from "./pages/user/Orders.jsx";
import Backtest       from "./pages/user/Backtest.jsx";
import Market         from "./pages/user/Market.jsx";
import StockDetail    from "./pages/user/StockDetail.jsx";
import Leaderboard    from "./pages/user/Leaderboard.jsx";
import Alerts         from "./pages/user/Alerts.jsx";
import UserSettings   from "./pages/user/UserSettings.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsers     from "./pages/admin/AdminUsers.jsx";
import AdminTrades    from "./pages/admin/AdminTrades.jsx";
import AdminAnalytics from "./pages/admin/AdminAnalytics.jsx";
import AdminSettings  from "./pages/admin/AdminSettings.jsx";
import LandingPage from "./pages/LandingPage.jsx";

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-loader">Loading…</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-loader">Loading…</div>;
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* <Route path="/"      element={<Navigate to="/login" replace />} /> */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />

      <Route path="/dashboard"       element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/watchlist"       element={<PrivateRoute><Watchlist /></PrivateRoute>} />
      <Route path="/portfolio"       element={<PrivateRoute><Portfolio /></PrivateRoute>} />
      <Route path="/orders"          element={<PrivateRoute><Orders /></PrivateRoute>} />
      <Route path="/backtest"        element={<PrivateRoute><Backtest /></PrivateRoute>} />
      <Route path="/market"          element={<PrivateRoute><Market /></PrivateRoute>} />
      <Route path="/stocks/:symbol"  element={<PrivateRoute><StockDetail /></PrivateRoute>} />
      <Route path="/leaderboard"     element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
      <Route path="/alerts"          element={<PrivateRoute><Alerts /></PrivateRoute>} />
      <Route path="/settings"        element={<PrivateRoute><UserSettings /></PrivateRoute>} />

      <Route path="/admin"           element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/users"     element={<PrivateRoute adminOnly><AdminUsers /></PrivateRoute>} />
      <Route path="/admin/trades"    element={<PrivateRoute adminOnly><AdminTrades /></PrivateRoute>} />
      <Route path="/admin/analytics" element={<PrivateRoute adminOnly><AdminAnalytics /></PrivateRoute>} />
      <Route path="/admin/settings"  element={<PrivateRoute adminOnly><AdminSettings /></PrivateRoute>} />

      {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
