import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Animated ticker data ─── */
const TICKER_ITEMS = [
  { sym: "RELIANCE", price: "₹2,847.30", chg: "+1.24%" },
  { sym: "TCS",      price: "₹3,512.75", chg: "+0.87%" },
  { sym: "INFY",     price: "₹1,623.40", chg: "-0.43%" },
  { sym: "HDFC",     price: "₹1,789.55", chg: "+2.11%" },
  { sym: "WIPRO",    price: "₹478.20",   chg: "-0.92%" },
  { sym: "BAJFINANCE",price:"₹6,934.10", chg: "+3.05%" },
  { sym: "SBIN",     price: "₹812.65",   chg: "+1.53%" },
  { sym: "ITC",      price: "₹449.80",   chg: "+0.28%" },
  { sym: "HCLTECH",  price: "₹1,245.90", chg: "+1.78%" },
  { sym: "TATAMOTORS",price:"₹924.45",   chg: "-0.64%" },
];

/* ─── Features ─── */
const FEATURES = [
  {
    icon: "◉",
    title: "Live Market Feed",
    desc: "Real-time NSE/BSE data streams with candlestick charts, depth analysis, and instant price alerts on any stock.",
    accent: "--accent-cyan",
  },
  {
    icon: "◈",
    title: "Smart Watchlist",
    desc: "Track unlimited stocks, set custom alerts for breakouts, and monitor price movements across all your favourites.",
    accent: "--accent-green",
  },
  {
    icon: "⬡",
    title: "Portfolio Tracker",
    desc: "Your complete P&L dashboard — positions, unrealised gains, realised profit and daily net worth movement.",
    accent: "--accent-gold",
  },
  {
    icon: "⟳",
    title: "Strategy Backtesting",
    desc: "Run SMA Crossover, RSI, MACD, Bollinger Bands and more against years of historical data in seconds.",
    accent: "--accent-purple",
  },
  {
    icon: "⬢",
    title: "Paper Trading",
    desc: "Trade risk-free with virtual capital. Place real buy/sell orders and build confidence before going live.",
    accent: "--accent-orange",
  },
  {
    icon: "🏆",
    title: "Leaderboard",
    desc: "Compete with traders globally. Rank by returns, win-rate, and Sharpe ratio. Prove your alpha.",
    accent: "--accent-red",
  },
];

/* ─── Stats ─── */
const STATS = [
  { val: "10,000+", label: "Active Traders" },
  { val: "₹2.4Cr",  label: "Avg Paper Portfolio" },
  { val: "6",       label: "Strategy Templates" },
  { val: "99.9%",   label: "Uptime" },
];

/* ─── How it works ─── */
const STEPS = [
  { num: "01", title: "Create Your Account",  desc: "Sign up free. Get ₹10,00,000 virtual capital instantly. No real money needed." },
  { num: "02", title: "Explore the Market",   desc: "Browse NSE/BSE stocks, read charts, set watchlists. Learn how real markets move." },
  { num: "03", title: "Place Paper Trades",   desc: "Buy and sell with virtual money. Track P&L, positions, and order history." },
  { num: "04", title: "Backtest Strategies",  desc: "Test your ideas on historical data. Find what works before risking a rupee." },
];

/* ─── Mini sparkline SVG ─── */
function Sparkline({ up = true }) {
  const pts = up
    ? "0,40 15,35 30,28 45,32 60,20 75,15 90,8 105,12 120,4"
    : "0,10 15,18 30,12 45,22 60,30 75,25 90,35 105,30 120,40";
  const fill = up ? "#00ff88" : "#ff3366";
  return (
    <svg width="120" height="44" viewBox="0 0 120 44" fill="none">
      <polyline points={pts} stroke={fill} strokeWidth="2" fill="none" opacity="0.9" />
      <polyline
        points={`0,44 ${pts} 120,44`}
        stroke="none"
        fill={fill}
        opacity="0.1"
      />
    </svg>
  );
}

/* ─── Animated counter ─── */
function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const num = parseFloat(target.replace(/[^\d.]/g, ""));
    if (isNaN(num)) { setCount(target); return; }
    let raf;
    const startTime = performance.now();
    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(eased * num * 10) / 10;
      setCount(target.replace(/[\d,]+\.?\d*/, current.toLocaleString("en-IN")));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start]);
  return count || "0";
}

function StatCard({ val, label }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const display = useCountUp(val, 1600, visible);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="lp-stat-card">
      <div className="lp-stat-val">{display}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

/* ─── Main component ─── */
export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  /* parallax dots */
  useEffect(() => {
    const handler = (e) => {
      const el = heroRef.current;
      if (!el) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      el.style.setProperty("--px", `${x}px`);
      el.style.setProperty("--py", `${y}px`);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="lp-root">
      {/* ── Topbar ── */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <div className="lp-logo">
            <span className="lp-logo-icon">⬡</span>
            <span className="lp-logo-name">AlphaMetrics</span>
          </div>
          <nav className="lp-nav">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#stats">Stats</a>
          </nav>
          <div className="lp-header-cta">
            <button className="lp-btn-ghost" onClick={() => navigate("/login")}>Log In</button>
            <button className="lp-btn-primary" onClick={() => navigate("/login")}>Start Free</button>
          </div>
        </div>
      </header>

      {/* ── Live ticker ── */}
      <div className="lp-ticker-wrap">
        <div className="lp-ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} className="lp-ticker-item">
              <span className="lp-ticker-sym">{t.sym}</span>
              <span className="lp-ticker-price">{t.price}</span>
              <span className={`lp-ticker-chg ${t.chg.startsWith("+") ? "up" : "dn"}`}>{t.chg}</span>
              <span className="lp-ticker-sep">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero-bg-grid" />
        <div className="lp-hero-orb lp-orb-1" />
        <div className="lp-hero-orb lp-orb-2" />
        <div className="lp-hero-orb lp-orb-3" />

        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            Paper Trading Platform · Risk-Free Learning
          </div>
          <h1 className="lp-hero-title">
            Trade Smarter.<br />
            <span className="lp-gradient-text">Zero Risk.</span><br />
            Real Markets.
          </h1>
          <p className="lp-hero-sub">
            AlphaMetrics gives you live NSE/BSE data, ₹10 lakh virtual capital,
            advanced backtesting, and a leaderboard — everything you need to become
            a confident trader before putting real money on the line.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary lp-btn-lg" onClick={() => navigate("/login")}>
              Start Paper Trading — Free
            </button>
            <button className="lp-btn-ghost lp-btn-lg" onClick={() => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}>
              See Features ↓
            </button>
          </div>

          {/* Mini card preview */}
          <div className="lp-hero-cards">
            <div className="lp-mini-card">
              <div className="lp-mini-card-top">
                <span className="lp-mini-sym">RELIANCE</span>
                <span className="lp-mini-badge up">+1.24%</span>
              </div>
              <div className="lp-mini-price">₹2,847.30</div>
              <Sparkline up={true} />
            </div>
            <div className="lp-mini-card lp-mini-card-2">
              <div className="lp-mini-card-top">
                <span className="lp-mini-sym">WIPRO</span>
                <span className="lp-mini-badge dn">-0.92%</span>
              </div>
              <div className="lp-mini-price">₹478.20</div>
              <Sparkline up={false} />
            </div>
            <div className="lp-mini-card lp-mini-card-3">
              <div className="lp-mini-card-top">
                <span className="lp-mini-sym">Portfolio P&L</span>
              </div>
              <div className="lp-mini-price" style={{ color: "var(--accent-green)" }}>+₹34,210</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>Today's gain</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-label">What you get</div>
          <h2 className="lp-section-title">Everything a serious trader needs</h2>
          <p className="lp-section-sub">One platform to learn, practise, backtest, and compete — all without risking a single rupee.</p>

          <div className="lp-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-feature-card">
                <div className="lp-feature-icon" style={{ color: `var(${f.accent})`, textShadow: `0 0 16px var(${f.accent})` }}>{f.icon}</div>
                <div className="lp-feature-title">{f.title}</div>
                <div className="lp-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="lp-stats-section" id="stats">
        <div className="lp-stats-inner">
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-section lp-section-dark" id="how">
        <div className="lp-section-inner">
          <div className="lp-section-label">How it works</div>
          <h2 className="lp-section-title">Four steps to trading confidence</h2>

          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div key={s.num} className="lp-step">
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-line" style={{ opacity: i < STEPS.length - 1 ? 1 : 0 }} />
                <div className="lp-step-body">
                  <div className="lp-step-title">{s.title}</div>
                  <div className="lp-step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta-section">
        <div className="lp-cta-orb" />
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title">Your trading journey starts here.</h2>
          <p className="lp-cta-sub">No credit card. No real money. Just real market experience.</p>
          <button className="lp-btn-primary lp-btn-xl" onClick={() => navigate("/login")}>
            Create Free Account →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-logo">
            <span className="lp-logo-icon">⬡</span>
            <span className="lp-logo-name">AlphaMetrics</span>
          </div>
          <div className="lp-footer-note">
            Paper trading only. No real financial transactions. For educational purposes.
          </div>
          <button className="lp-btn-ghost lp-footer-login" onClick={() => navigate("/login")}>
            Log In →
          </button>
        </div>
      </footer>
    </div>
  );
}