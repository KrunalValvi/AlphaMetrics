import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode]       = useState("login");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    let result;
    if (mode === "login") {
      result = await login(email, password);
    } else {
      if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
      result = await signup(name, email, password);
    }
    setLoading(false);
    if (result.success) {
      navigate(result.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-base)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      {/* Glow blobs */}
      <div style={{ position: "fixed", top: "20%", left: "15%", width: 300, height: 300, background: "rgba(0,212,255,0.06)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "20%", right: "15%", width: 300, height: 300, background: "rgba(0,255,136,0.05)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Alpha<span style={{ color: "var(--accent-cyan)" }}>Metrics</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 6 }}>
            NSE Paper Trading Simulator
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "32px 28px" }}>
          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 28 }}>
            <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); }}>
              Sign In
            </button>
            <button className={`tab ${mode === "signup" ? "active" : ""}`} onClick={() => { setMode("signup"); setError(""); }}>
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <div>
                <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Full Name</label>
                <input
                  type="text" placeholder="Your name"
                  value={name} onChange={(e) => setName(e.target.value)}
                  required style={{ width: "100%" }}
                />
              </div>
            )}
            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Email Address</label>
              <input
                type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Password</label>
              <input
                type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPass(e.target.value)}
                required style={{ width: "100%" }}
              />
            </div>

            {error && (
              <div style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--accent-red)" }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: 4, width: "100%", padding: "12px", fontSize: "0.85rem" }} disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          {mode === "login" && (
            <div style={{ marginTop: 20, padding: "14px", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: 8 }}>Demo credentials</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                <div>User: <span style={{ color: "var(--accent-cyan)" }}>krunal@example.com</span> / <span style={{ color: "var(--accent-cyan)" }}>password123</span></div>
                <div>Admin: <span style={{ color: "var(--accent-gold)" }}>admin@alphametrics.in</span> / <span style={{ color: "var(--accent-gold)" }}>admin123</span></div>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)" }}>
          Starting balance: ₹10,00,000 virtual cash · No real money involved
        </div>
      </div>
    </div>
  );
}
