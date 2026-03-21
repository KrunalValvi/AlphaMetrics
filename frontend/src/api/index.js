const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

async function request(method, path, body = null) {
  const token = localStorage.getItem("am_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const api = {
  get:    (path)       => request("GET",    path),
  post:   (path, body) => request("POST",   path, body),
  patch:  (path, body) => request("PATCH",  path, body),
  delete: (path)       => request("DELETE", path),
};

export const authAPI = {
  login:          (email, password)       => api.post("/auth/login",  { email, password }),
  signup:         (name, email, password) => api.post("/auth/signup", { name, email, password }),
  me:             ()                      => api.get("/auth/me"),
  updateProfile:  (data)                  => api.patch("/auth/profile", data),
  resetPortfolio: (balance)               => api.post("/auth/reset-portfolio", { balance }),
};

export const stocksAPI = {
  all:     ()               => api.get("/stocks"),
  indices: ()               => api.get("/stocks/indices"),
  one:     (symbol)         => api.get(`/stocks/${symbol}`),
  history: (symbol, period) => api.get(`/stocks/${symbol}/history?period=${period}`),
  news:    (symbol)         => api.get(`/stocks/${symbol}/news`),
};

export const tradesAPI = {
  list:    ()                                                   => api.get("/trades"),
  execute: (symbol, name, type, qty, price, orderType, sector) =>
    api.post("/trades", { symbol, name, type, qty, price, orderType, sector }),
  exportCSV: () => {
    const token = localStorage.getItem("am_token");
    const link  = document.createElement("a");
    link.href = `/api/trades/export`;
    // Fetch with auth header then trigger download
    fetch("/api/trades/export", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `trades_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      });
  },
};

export const portfolioAPI = {
  positions: ()          => api.get("/portfolio"),
  equity:    (days = 30) => api.get(`/portfolio/equity?days=${days}`),
  stats:     ()          => api.get("/portfolio/stats"),
};

export const watchlistAPI = {
  get:    ()       => api.get("/watchlist"),
  add:    (symbol) => api.post(`/watchlist/${symbol}`),
  remove: (symbol) => api.delete(`/watchlist/${symbol}`),
};

export const alertsAPI = {
  list:    ()                                     => api.get("/alerts"),
  create:  (symbol, name, targetPrice, condition) => api.post("/alerts", { symbol, name, targetPrice, condition }),
  delete:  (id)                                   => api.delete(`/alerts/${id}`),
  reset:   (id)                                   => api.patch(`/alerts/${id}/reset`),
  dismiss: (id)                                   => api.patch(`/alerts/${id}/reset`), // alias
};

export const leaderboardAPI = {
  get: () => api.get("/leaderboard"),
};

export const adminAPI = {
  stats:        ()           => api.get("/admin/stats"),
  users:        ()           => api.get("/admin/users"),
  trades:       ()           => api.get("/admin/trades"),
  updateStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
};