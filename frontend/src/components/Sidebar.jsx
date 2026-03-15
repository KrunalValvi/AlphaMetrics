import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const UserNavItems = [
  { icon: "⬡", label: "Dashboard",   path: "/dashboard" },
  { icon: "◈", label: "Watchlist",   path: "/watchlist" },
  { icon: "◎", label: "Portfolio",   path: "/portfolio" },
  { icon: "⬢", label: "Orders",      path: "/orders" },
  { icon: "⟳", label: "Backtesting", path: "/backtest" },
  { icon: "◉", label: "Market",      path: "/market" },
  { icon: "🏆", label: "Leaderboard",path: "/leaderboard" },
  { icon: "🔔", label: "Alerts",     path: "/alerts" },
];

const AdminNavItems = [
  { icon: "⬡", label: "Overview",  path: "/admin" },
  { icon: "◈", label: "Users",     path: "/admin/users" },
  { icon: "◎", label: "Trades",    path: "/admin/trades" },
  { icon: "⬢", label: "Analytics", path: "/admin/analytics" },
  { icon: "⟳", label: "Settings",  path: "/admin/settings" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, dataMode, toggleDataMode } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isAdmin   = user?.role === "admin";
  const navItems  = isAdmin ? AdminNavItems : UserNavItems;

  const handleNav    = (path) => { navigate(path); if (onClose) onClose(); };
  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <>
      <div className={`sidebar-overlay${isOpen ? " visible" : ""}`} onClick={onClose} aria-hidden="true" />

      <aside className={`sidebar${isOpen ? " open" : ""}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-text-wrap">
            <div className="logo-text">AlphaMetrics</div>
            <div className="logo-sub">{isAdmin ? "Admin Console" : "Paper Trading"}</div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">✕</button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.map((item) => (
            <div
              key={item.path}
              className={`nav-item${location.pathname === item.path ? " active" : ""}`}
              onClick={() => handleNav(item.path)}
              role="button" tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleNav(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}

          {/* Account section — users only */}
          {!isAdmin && (
            <>
              <div className="nav-section-label" style={{ marginTop: 8 }}>Account</div>
              <div
                className={`nav-item${location.pathname === "/settings" ? " active" : ""}`}
                onClick={() => handleNav("/settings")}
                role="button" tabIndex={0}
              >
                <span className="nav-icon">⚙</span>
                <span>Settings</span>
              </div>
            </>
          )}

          {/* Data mode toggle pill */}
          {!isAdmin && (
            <div
              onClick={toggleDataMode}
              role="button" tabIndex={0}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", margin: "8px 8px 0", borderRadius: "var(--radius-md)",
                background: dataMode === "live" ? "rgba(0,255,136,0.08)" : "rgba(180,77,255,0.08)",
                border: dataMode === "live" ? "1px solid rgba(0,255,136,0.2)" : "1px solid rgba(180,77,255,0.2)",
                cursor: "pointer", transition: "var(--transition)",
              }}
            >
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-primary)", fontWeight: 600 }}>
                  {dataMode === "live" ? "🌐 Live Data" : "🎮 Simulation"}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {dataMode === "live" ? "Yahoo Finance" : "Mock prices · 24/7"}
                </div>
              </div>
              <div style={{
                width: 36, height: 20, borderRadius: 10,
                background: dataMode === "live" ? "var(--accent-green)" : "var(--bg-elevated)",
                border: "1px solid var(--border)", position: "relative",
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: "50%", background: "white",
                  position: "absolute", top: 2, left: dataMode === "live" ? 18 : 2,
                  transition: "var(--transition)",
                }} />
              </div>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={handleLogout} title="Click to logout" role="button" tabIndex={0}>
            <div className="sidebar-avatar" style={{ background: user?.avatarColor || "var(--accent-cyan)" }}>
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="sidebar-user-info">
              <div className="user-name">{user?.name?.split(" ")[0] || "User"}</div>
              <div className="user-role">{isAdmin ? "Administrator" : "Trader"} · Logout</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
