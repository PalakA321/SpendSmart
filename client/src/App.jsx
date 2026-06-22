import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const API = "http://localhost:5000/api/transactions";

const CATEGORIES = ["Food","Transport","Shopping","Entertainment","Health","Education","Salary","Freelance","Other"];
const CAT_META = {
  Food:          { icon: "🍔", bg: "rgba(255,200,50,0.15)",  color: "#FFD700" },
  Transport:     { icon: "🚌", bg: "rgba(79,172,254,0.15)",  color: "#4FACFE" },
  Shopping:      { icon: "🛍️", bg: "rgba(180,127,255,0.15)", color: "#B47FFF" },
  Entertainment: { icon: "🎬", bg: "rgba(252,110,168,0.15)", color: "#FC6EA8" },
  Health:        { icon: "💊", bg: "rgba(0,245,160,0.15)",   color: "#00F5A0" },
  Education:     { icon: "📚", bg: "rgba(79,172,254,0.15)",  color: "#4FACFE" },
  Salary:        { icon: "💰", bg: "rgba(0,245,160,0.15)",   color: "#00F5A0" },
  Freelance:     { icon: "💻", bg: "rgba(180,127,255,0.15)", color: "#B47FFF" },
  Other:         { icon: "📌", bg: "rgba(255,255,255,0.08)", color: "#8892B0" },
};

const fmt = (n) =>
  "₹" + Math.abs(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d.slice(0, 10) + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// ── TOAST ──────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  const colors = {
    success: { bg: "rgba(0,245,160,0.15)", border: "rgba(0,245,160,0.35)", color: "#00F5A0" },
    error:   { bg: "rgba(255,75,110,0.15)", border: "rgba(255,75,110,0.35)", color: "#FF4B6E" },
    info:    { bg: "rgba(255,215,0,0.12)", border: "rgba(255,215,0,0.3)", color: "#FFD700" },
  };
  const s = colors[type] || colors.info;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      padding: "13px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      fontFamily: "'Space Grotesk', sans-serif", boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      animation: "slideUp 0.3s ease",
    }}>
      {msg}
    </div>
  );
}

// ── AUTH SCREEN ────────────────────────────────────────────────────────────
function AuthScreen({ onLogin, onSignup, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");

  const inputStyle = {
    width: "100%", padding: "12px 14px", marginBottom: 12,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, color: "#F8FAFF", fontSize: 14, outline: "none",
    fontFamily: "'Space Grotesk', sans-serif",
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mode === "login" ? onLogin(email, password) : onSignup(email, password);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#05060d", fontFamily: "'Space Grotesk', sans-serif",
    }}>
      {/* bg glow */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 600px 400px at 80% 0%, rgba(255,215,0,0.07) 0%, transparent 60%), radial-gradient(ellipse 500px 400px at 10% 80%, rgba(0,245,160,0.06) 0%, transparent 55%)" }} />

      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 420, padding: "0 20px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: "linear-gradient(135deg,#FFD700,#FFA500)",
            borderRadius: 16, display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 800, color: "#05060d", marginBottom: 16,
            boxShadow: "0 0 40px rgba(255,215,0,0.3)",
          }}>₹</div>
          <div style={{
            fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800,
            background: "linear-gradient(90deg,#fff 0%,#FFD700 60%,#FFA500 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>SpendSmart</div>
          <div style={{ fontSize: 13, color: "#3D4A6B", marginTop: 4 }}>Personal Finance Tracker</div>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20, padding: "2rem", backdropFilter: "blur(20px)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "10px", borderRadius: 10, border: "1px solid",
                borderColor: mode === m ? "#FFD700" : "rgba(255,255,255,0.08)",
                background: mode === m ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.03)",
                color: mode === m ? "#FFD700" : "#8892B0",
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600,
                cursor: "pointer", textTransform: "capitalize",
              }}>{m}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#3D4A6B", textTransform: "uppercase", letterSpacing: "0.1em" }}>Email</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} style={inputStyle} required />

            <label style={{ fontSize: 10, fontWeight: 700, color: "#3D4A6B", textTransform: "uppercase", letterSpacing: "0.1em" }}>Password</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} style={inputStyle} required />

            {error && <div style={{ color: "#FF4B6E", fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>}

            <button type="submit" style={{
              width: "100%", padding: 14, marginTop: 4,
              background: "linear-gradient(135deg,#FFD700,#FFA500)",
              color: "#05060d", border: "none", borderRadius: 10,
              fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800,
              cursor: "pointer", boxShadow: "0 0 30px rgba(255,215,0,0.25)",
            }}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────
function App() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", amount: "", category: "Food", type: "expense", date: "", note: "" });

  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [budget, setBudget] = useState(() => parseFloat(localStorage.getItem("ss_budget")) || 0);
  const [budgetInput, setBudgetInput] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  // today's date as default
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  // ── AUTH ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
      if (u) {
        alert("UID: " + u.uid);
        fetchAll(u.uid);
      }
    });
    return () => unsub();
  }, []);
  const handleLogin = async (email, password) => {
    try { setAuthError(""); await signInWithEmailAndPassword(auth, email, password); }
    catch (e) { setAuthError(e.message.replace("Firebase: ", "")); }
  };

  const handleSignup = async (email, password) => {
    try { setAuthError(""); await createUserWithEmailAndPassword(auth, email, password); }
    catch (e) { setAuthError(e.message.replace("Firebase: ", "")); }
  };

  const handleLogout = async () => { await signOut(auth); setTransactions([]); setSummary({ income: 0, expense: 0, balance: 0 }); };

  // ── API ──
  const fetchAll = async () => {
    console.log("Fetching for userId:", uid); 
    try {
      setLoading(true);
      const [txRes, sumRes] = await Promise.all([axios.get(API), axios.get(`${API}/summary`)]);
      setTransactions(txRes.data.data || []);
      setSummary(sumRes.data.data || {});
    } catch { showToast("Could not connect to server", "error"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { title: form.title, amount: Number(form.amount), category: form.category, type: form.type, date: form.date, note: form.note };
    try {
      if (editId) { await axios.put(`${API}/${editId}`, payload); showToast("Transaction updated!", "info"); }
      else { await axios.post(API, payload); showToast("Transaction added!", "success"); }
      setShowModal(false); setEditId(null);
      setForm({ title: "", amount: "", category: "Food", type: "expense", date: todayStr(), note: "" });
      fetchAll();
    } catch { showToast("Something went wrong", "error"); }
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API}/${id}`); showToast("Deleted", "error"); fetchAll(); }
    catch { showToast("Delete failed", "error"); }
  };

  const startEdit = (t) => {
    setEditId(t._id);
    setForm({ title: t.title, amount: t.amount, category: t.category, type: t.type, date: t.date?.slice(0,10) || todayStr(), note: t.note || "" });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ title: "", amount: "", category: "Food", type: "expense", date: todayStr(), note: "" });
    setShowModal(true);
  };

  // ── BUDGET ──
  const saveBudget = () => {
    const v = parseFloat(budgetInput);
    if (!isNaN(v) && v > 0) { setBudget(v); localStorage.setItem("ss_budget", v); showToast("Budget set!"); }
  };

  // ── FILTER ──
  const filtered = transactions
    .filter(t => filter === "all" || t.type === filter)
    .filter(t => catFilter === "all" || t.category === catFilter)
    .filter(t => !search || t.title.toLowerCase().includes(search) || t.category.toLowerCase().includes(search))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // ── BUDGET CALC ──
  const thisMonth = new Date().toISOString().slice(0, 7);
  const spent = transactions.filter(t => t.type === "expense" && t.date?.slice(0,7) === thisMonth).reduce((s,t) => s + t.amount, 0);
  const budgetPct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  // ── STYLES (shared) ──
  const s = {
    panel: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "1.5rem", marginBottom: 16, backdropFilter: "blur(20px)", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" },
    panelTitle: { fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, color: "#8892B0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 },
    input: { width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "#F8FAFF", fontSize: 14, outline: "none", fontFamily: "'Space Grotesk', sans-serif", boxSizing: "border-box" },
    label: { fontSize: 10, fontWeight: 700, color: "#3D4A6B", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 5 },
    btnGold: { background: "linear-gradient(135deg,#FFD700,#FFA500)", color: "#05060d", border: "none", borderRadius: 10, padding: "12px 20px", fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 0 20px rgba(255,215,0,0.2)" },
    btnGlass: { background: "rgba(255,255,255,0.05)", color: "#8892B0", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "9px 16px", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  };

  if (!authChecked) return (
    <div style={{ minHeight: "100vh", background: "#05060d", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, border: "3px solid rgba(255,215,0,0.15)", borderTopColor: "#FFD700", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  );

  if (!user) return <AuthScreen onLogin={handleLogin} onSignup={handleSignup} error={authError} />;

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", background: "#05060d", color: "#F8FAFF", minHeight: "100vh" }}>
      {/* BG */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 600px 400px at 80% 0%, rgba(255,215,0,0.07) 0%, transparent 60%), radial-gradient(ellipse 500px 400px at 10% 80%, rgba(0,245,160,0.06) 0%, transparent 55%)" }} />

      {/* NAVBAR */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 200, height: 68, padding: "0 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(5,6,13,0.88)", backdropFilter: "blur(30px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, background: "linear-gradient(135deg,#FFD700,#FFA500)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#05060d", boxShadow: "0 0 30px rgba(255,215,0,0.25)" }}>₹</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, background: "linear-gradient(90deg,#fff 0%,#FFD700 60%,#FFA500 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SpendSmart</div>
            <div style={{ fontSize: 11, color: "#3D4A6B" }}>Personal Finance Tracker</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, color: "#8892B0", marginRight: 4 }}>{user.email}</div>
          <button onClick={openAdd} style={s.btnGold}>+ Add</button>
          <button onClick={handleLogout} style={s.btnGlass}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "2rem 1.5rem", position: "relative", zIndex: 1 }}>

        {/* SUMMARY CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
          {[
            { label: "Total Balance", val: fmt((summary.income||0)-(summary.expense||0)), color: "#FFD700", glow: "rgba(255,215,0,0.2)", bg: "rgba(255,215,0,0.08)", sym: "₹" },
            { label: "Total Income",  val: fmt(summary.income||0), color: "#00F5A0", glow: "rgba(0,245,160,0.2)", bg: "rgba(0,245,160,0.07)", sym: "+" },
            { label: "Total Expenses",val: fmt(summary.expense||0), color: "#FF4B6E", glow: "rgba(255,75,110,0.2)", bg: "rgba(255,75,110,0.07)", sym: "−" },
          ].map(card => (
            <div key={card.label} style={{ ...s.panel, background: card.bg, borderColor: card.glow, marginBottom: 0, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -10, bottom: -20, fontSize: 100, fontWeight: 800, opacity: 0.06, color: card.color, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{card.sym}</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: card.color, opacity: 0.7, marginBottom: 10 }}>{card.label}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 30, fontWeight: 700, color: card.color, textShadow: `0 0 30px ${card.glow}`, letterSpacing: -1 }}>{card.val}</div>
            </div>
          ))}
        </div>

        {/* BUDGET BAR */}
        {budget > 0 && (
          <div style={{ ...s.panel, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginBottom: 20, padding: "1rem 1.5rem" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#3D4A6B", textTransform: "uppercase", letterSpacing: "0.1em" }}>Budget</span>
            <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: budgetPct.toFixed(1)+"%", borderRadius: 99, transition: "width 0.5s", background: budgetPct >= 100 ? "linear-gradient(90deg,#FF4B6E,#FF1744)" : budgetPct >= 80 ? "linear-gradient(90deg,#FFA500,#FF6B35)" : "linear-gradient(90deg,#00F5A0,#00D4AA)" }} />
              </div>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color: "#8892B0", whiteSpace: "nowrap" }}>{fmt(spent)} / {fmt(budget)} ({Math.round(budgetPct)}%)</span>
            </div>
            {budgetPct >= 80 && <span style={{ fontSize: 13, color: budgetPct >= 100 ? "#FF4B6E" : "#FFA500" }}>{budgetPct >= 100 ? "⚠ Budget exceeded!" : "⚡ Near limit!"}</span>}
          </div>
        )}

        {/* SET BUDGET */}
        <div style={{ ...s.panel, display: "flex", alignItems: "center", gap: 12, padding: "0.9rem 1.5rem", marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#3D4A6B", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>Monthly Budget</span>
          <input type="number" placeholder="e.g. 10000" value={budgetInput} onChange={e => setBudgetInput(e.target.value)}
            style={{ ...s.input, width: 160 }} />
          <button onClick={saveBudget} style={s.btnGlass}>Set</button>
        </div>

        {/* MAIN GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 20, alignItems: "start" }}>

          {/* LEFT — TRANSACTIONS */}
          <div>
            <div style={s.panel}>
              <div style={s.panelTitle}><span style={{ width: 3, height: 16, background: "linear-gradient(180deg,#FFD700,#FFA500)", borderRadius: 99, display: "inline-block" }} /> Transactions</div>

              {/* Search + filters */}
              <input placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value.toLowerCase())}
                style={{ ...s.input, marginBottom: 12 }} />

              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                {["all","income","expense"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    ...s.btnGlass, padding: "5px 16px", fontSize: 12, borderRadius: 99,
                    borderColor: filter === f ? "#FFD700" : "rgba(255,255,255,0.07)",
                    color: filter === f ? "#FFD700" : "#8892B0",
                    background: filter === f ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.04)",
                  }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
                ))}
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  style={{ ...s.input, width: "auto", padding: "5px 13px", fontSize: 12, borderRadius: 99 }}>
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
                {loading && <div style={{ textAlign: "center", color: "#3D4A6B", padding: "2rem" }}>Loading...</div>}
                {!loading && filtered.length === 0 && (
                  <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#3D4A6B" }}>
                    <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>💸</div>
                    <p style={{ fontSize: 15, fontWeight: 500 }}>No transactions yet</p>
                    <p style={{ fontSize: 13, marginTop: 6, opacity: 0.6 }}>Add one to get started!</p>
                  </div>
                )}
                {filtered.map(t => {
                  const c = CAT_META[t.category] || CAT_META.Other;
                  return (
                    <div key={t._id} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                      background: "rgba(255,255,255,0.03)", borderRadius: 12,
                      borderLeft: `3px solid ${t.type === "income" ? "#00F5A0" : "#FF4B6E"}`,
                      border: `1px solid rgba(255,255,255,0.05)`,
                      borderLeftColor: t.type === "income" ? "#00F5A0" : "#FF4B6E",
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{c.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: "#3D4A6B", marginTop: 3 }}>{t.category} · {fmtDate(t.date)}{t.note ? " · "+t.note : ""}</div>
                      </div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 14, fontWeight: 700, color: t.type === "income" ? "#00F5A0" : "#FF4B6E", marginRight: 8, whiteSpace: "nowrap" }}>
                        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                      </div>
                      <button onClick={() => startEdit(t)} title="Edit" style={{ background: "none", border: "none", color: "#4FACFE", cursor: "pointer", fontSize: 14, padding: "4px 6px", borderRadius: 6 }}>✏️</button>
                      <button onClick={() => handleDelete(t._id)} title="Delete" style={{ background: "none", border: "none", color: "#FF4B6E", cursor: "pointer", fontSize: 14, padding: "4px 6px", borderRadius: 6 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — INSIGHTS */}
          <div>
            <div style={s.panel}>
              <div style={s.panelTitle}><span style={{ width: 3, height: 16, background: "linear-gradient(180deg,#FFD700,#FFA500)", borderRadius: 99, display: "inline-block" }} /> Monthly Insights</div>
              {transactions.length === 0
                ? <p style={{ fontSize: 13, color: "#3D4A6B", textAlign: "center", padding: "1.5rem 0" }}>Add transactions to see insights.</p>
                : <Insights transactions={transactions} budget={budget} />
              }
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ ...s.panel, width: "100%", maxWidth: 460, marginBottom: 0, animation: "slideUp 0.25s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700 }}>{editId ? "Edit" : "Add"} Transaction</div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#8892B0", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <label style={s.label}>Title</label>
              <input style={{ ...s.input, marginBottom: 12 }} placeholder="e.g. Grocery shopping" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={s.label}>Amount (₹)</label>
                  <input style={s.input} type="number" placeholder="0.00" min="0" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                </div>
                <div>
                  <label style={s.label}>Date</label>
                  <input style={s.input} type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={s.label}>Type</label>
                  <select style={s.input} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="expense">💸 Expense</option>
                    <option value="income">💰 Income</option>
                  </select>
                </div>
                <div>
                  <label style={s.label}>Category</label>
                  <select style={s.input} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_META[c]?.icon} {c}</option>)}
                  </select>
                </div>
              </div>

              <label style={s.label}>Note (optional)</label>
              <input style={{ ...s.input, marginBottom: 20 }} placeholder="Any extra detail..." value={form.note} onChange={e => setForm({...form, note: e.target.value})} />

              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" style={{ ...s.btnGold, flex: 1, padding: 14, fontSize: 15 }}>{editId ? "✓ Save Changes" : "+ Add Transaction"}</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ ...s.btnGlass, padding: "14px 16px" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast msg={toast.msg} type={toast.type} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        input::placeholder { color: #3D4A6B; }
        select option { background: #0c0e1a; color: #F8FAFF; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.25); border-radius: 99px; }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

// ── INSIGHTS COMPONENT ─────────────────────────────────────────────────────
function Insights({ transactions, budget }) {
  const fmt = (n) => "₹" + Math.abs(Number(n)||0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const mo = new Date().toISOString().slice(0, 7);
  const prev = (() => { const d = new Date(); d.setMonth(d.getMonth()-1); return d.toISOString().slice(0,7); })();

  const thisExp = transactions.filter(t => t.type === "expense" && t.date?.slice(0,7) === mo);
  const lastExp = transactions.filter(t => t.type === "expense" && t.date?.slice(0,7) === prev);
  const thisT = thisExp.reduce((s,t) => s+t.amount, 0);
  const lastT = lastExp.reduce((s,t) => s+t.amount, 0);

  const cats = {};
  thisExp.forEach(t => { cats[t.category] = (cats[t.category]||0) + t.amount; });
  const top = Object.entries(cats).sort((a,b) => b[1]-a[1])[0];

  const ins = [];
  if (thisT > 0) ins.push({ i: "📊", t: `Spent <strong>${fmt(thisT)}</strong> this month.` });
  if (top) { const p = Math.round((top[1]/thisT)*100); ins.push({ i: CAT_META[top[0]]?.icon||"📌", t: `<strong>${top[0]}</strong> is top expense — ${fmt(top[1])} (${p}%).` }); }
  if (lastT > 0 && thisT > 0) { const d = thisT-lastT; const dp = Math.abs(Math.round((d/lastT)*100)); ins.push(d > 0 ? { i: "📈", t: `Spending <strong>${dp}% higher</strong> than last month.` } : { i: "📉", t: `Great! <strong>${dp}% lower</strong> than last month.` }); }
  if (budget > 0) { const rem = budget - thisT; if (rem > 0) ins.push({ i: "💡", t: `<strong>${fmt(rem)}</strong> left in budget this month.` }); }
  if (thisT > 0) { const avg = thisT / new Date().getDate(); ins.push({ i: "🗓️", t: `Daily avg: <strong>${fmt(avg)}</strong>.` }); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {ins.map((x, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 12, fontSize: 13, color: "#8892B0", lineHeight: 1.65, border: "1px solid rgba(255,255,255,0.05)", background: i%2===0 ? "rgba(255,215,0,0.03)" : "rgba(0,245,160,0.03)" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{x.i}</span>
          <span dangerouslySetInnerHTML={{ __html: x.t }} />
        </div>
      ))}
    </div>
  );
}

export default App;