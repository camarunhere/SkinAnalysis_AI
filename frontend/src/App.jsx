import { useState } from "react";
import { api, clearSession, getStoredUser, getToken } from "./api";
import LandingPage from "./LandingPage";
import AuthPage from "./AuthPage";
import UserPortal from "./UserPortal";
import AdminPortal from "./AdminPortal";
import Background, { BG_TINTS } from "./Background";

const NAV = {
  user: [
    ["dashboard", "Dashboard"],
    ["analyze", "Analyze"],
    ["explain", "Explainable AI"],
    ["recommend", "Recommendations"],
    ["history", "History"],
    ["profile", "Profile"],
  ],
  admin: [
    ["reports", "System Reports"],
    ["users", "Manage Users"],
    ["catalog", "Manage Products"],
    ["model", "Monitor AI Model"],
  ],
};

const PAGE_HERO = {
  user: {
    dashboard: ["🧴", "Your Skin Dashboard", "An overview of your latest analysis and skin health status.", "from-rose-800 via-orange-700 to-amber-600"],
    analyze: ["📷", "Analyze Skin Image", "Upload a clear facial photo to get an instant AI-based analysis.", "from-rose-900 via-pink-800 to-orange-700"],
    explain: ["🔥", "Explainable AI — Grad-CAM", "See exactly which region of your image the AI focused on.", "from-orange-700 via-red-700 to-amber-700"],
    recommend: ["🧴", "Skincare Recommendations", "Products matched to your latest detected skin condition.", "from-pink-700 via-rose-700 to-fuchsia-700"],
    history: ["📊", "Analysis History", "Every past analysis, condition, and confidence over time.", "from-amber-700 via-orange-700 to-rose-700"],
    profile: ["👤", "Profile", "Your account details and skin profile.", "from-slate-700 via-rose-900 to-slate-800"],
  },
  admin: {
    reports: ["📈", "System Reports", "Aggregate usage, condition distribution, and referral stats.", "from-indigo-900 via-slate-800 to-blue-900"],
    users: ["👥", "Manage Users", "View and moderate registered user accounts.", "from-slate-800 via-indigo-800 to-slate-900"],
    catalog: ["🧴", "Manage Products", "Create, edit, and remove the skincare product catalog.", "from-blue-900 via-indigo-800 to-slate-800"],
    model: ["🤖", "Monitor AI Model", "Live health and metadata for the ML service.", "from-violet-900 via-indigo-900 to-slate-900"],
  },
};

const PAGE_BG = {
  user: { dashboard: "glow", analyze: "upload", explain: "heatmap", recommend: "droplets", history: "timeline", profile: "rings" },
  admin: { reports: "bars", users: "grid", catalog: "cards", model: "circuit" },
};

// Each page gets its own entrance animation so switching tabs never feels
// like a generic reused transition.
const PAGE_ANIM = {
  user: { dashboard: "animate-fade-up-page", analyze: "animate-slide-right-page", explain: "animate-zoom-in-page", recommend: "animate-soft-scale-page", history: "animate-slide-left-page", profile: "animate-soft-scale-page" },
  admin: { reports: "animate-fade-down-page", users: "animate-slide-up-fast-page", catalog: "animate-flip-in-page", model: "animate-pulse-in-page" },
};

export default function App() {
  const [view, setView] = useState(() => (getToken() ? "app" : "landing")); // landing | auth | app
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null));
  const [tab, setTab] = useState(null);

  if (view === "landing" && !user) return <LandingPage onGetStarted={() => setView("auth")} />;
  if (!user) return <AuthPage onLogin={(u) => { setUser(u); setTab(NAV[u.role][0][0]); setView("app"); }} onBack={() => setView("landing")} />;

  const nav = NAV[user.role] || [];
  const active = tab || nav[0][0];

  const logout = async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } catch { /* token may be stale */ }
    clearSession();
    setUser(null);
    setTab(null);
    setView("landing");
  };

  const bgVariant = PAGE_BG[user.role]?.[active] || "glow";
  const hero = PAGE_HERO[user.role]?.[active];
  const anim = PAGE_ANIM[user.role]?.[active] || "animate-fade-up-page";

  return (
    <div className={`min-h-screen ${BG_TINTS[bgVariant] || "bg-slate-100"}`}>
      <Background variant={bgVariant} />
      <header className={`bg-gradient-to-r ${user.role === "admin" ? "from-slate-950 via-indigo-950 to-slate-900" : "from-rose-950 via-slate-900 to-orange-950"} border-b border-white/10 sticky top-0 z-20 shadow-lg shadow-slate-900/20`}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <div className="font-bold text-white whitespace-nowrap">🔬 AI Skin Analysis</div>
          <nav className="flex gap-1 overflow-x-auto">
            {nav.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  active === key ? "bg-white/15 text-white shadow-inner" : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right hidden lg:block whitespace-nowrap">
              <div className="text-sm font-semibold text-white leading-tight">{user.full_name}</div>
              <div className="text-xs text-slate-300 capitalize leading-tight">{user.role}</div>
            </div>
            <button onClick={logout} className="text-sm font-semibold text-slate-300 hover:text-red-400 transition">Logout</button>
          </div>
        </div>
      </header>

      <main key={active} className={`relative z-10 max-w-5xl mx-auto px-4 py-8 ${anim}`}>
        {hero && (
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${hero[3]} text-white p-6 sm:p-8 mb-6 shadow-xl shadow-slate-900/20`}>
            <div className="absolute -right-4 -bottom-8 text-[7rem] opacity-20 select-none pointer-events-none">{hero[0]}</div>
            <h1 className="text-2xl font-bold relative">{hero[1]}</h1>
            <p className="text-sm text-white/80 mt-1 relative max-w-xl">{hero[2]}</p>
          </div>
        )}
        {user.role === "admin" ? <AdminPortal tab={active} /> : <UserPortal tab={active} onNavigate={setTab} />}
      </main>
    </div>
  );
}
