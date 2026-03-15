import React, { useState, useEffect } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { adminAPI } from "../../api/index.js";

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    adminAPI.users()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (user) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      const updated = await adminAPI.updateStatus(user._id, newStatus);
      setUsers((prev) => prev.map((u) => u._id === updated._id ? updated : u));
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = users.filter((u) => u.role === "user").reduce((s, u) => s + (u.balance || 0), 0);

  return (
    <AppLayout title="User Management">
      <div className="page-body" style={{ paddingTop: 24 }}>
        <div className="grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: "Total Users",   value: users.filter((u) => u.role !== "admin").length, color: "cyan" },
            { label: "Active",        value: users.filter((u) => u.status === "active" && u.role !== "admin").length, color: "green" },
            { label: "Inactive",      value: users.filter((u) => u.status === "inactive").length, color: "red" },
            { label: "Total Balance", value: `₹${(totalBalance / 100000).toFixed(1)}L`, color: "gold" },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: "1.2rem" }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <input
            type="text" placeholder="Search users by name or email…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 360 }}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">All Users</div>
            <span className="badge badge-cyan">{filtered.length} users</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Balance</th><th>Trades</th><th>Joined</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8}><div className="empty-state"><p>Loading users…</p></div></td></tr>
                ) : filtered.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>{u.name}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>{u.email}</td>
                    <td><span className={`badge ${u.role === "admin" ? "badge-gold" : "badge-cyan"}`}>{u.role}</span></td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>₹{(u.balance || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{u.trades || 0}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                    <td><span className={`badge ${u.status === "active" ? "badge-green" : "badge-red"}`}>{u.status}</span></td>
                    <td>
                      {u.role !== "admin" && (
                        <button
                          className={`btn btn-sm ${u.status === "active" ? "btn-red" : "btn-green"}`}
                          onClick={() => toggleStatus(u)}
                        >
                          {u.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
