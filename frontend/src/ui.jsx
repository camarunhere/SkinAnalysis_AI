import { useEffect, useState } from "react";

export function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white/85 backdrop-blur-md border border-white/70 rounded-2xl shadow-lg shadow-slate-900/[0.06] p-6 transition-shadow hover:shadow-xl ${className}`}>
      {title && (
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">{title}</h2>
      )}
      {children}
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-gradient-to-r from-rose-700 to-orange-600 hover:from-rose-800 hover:to-orange-700 text-white shadow-md shadow-rose-700/25",
    danger: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md shadow-red-600/25",
    subtle: "bg-white/70 hover:bg-white border border-slate-200 text-slate-700 shadow-sm",
    success: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/25",
    admin: "bg-gradient-to-r from-indigo-700 to-slate-700 hover:from-indigo-800 hover:to-slate-800 text-white shadow-md shadow-indigo-700/25",
  };
  return (
    <button
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      {children}
      {hint}
    </div>
  );
}

export const inputCls =
  "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-rose-700/25 focus:border-rose-600 hover:border-slate-400 bg-white";

export function Alert({ kind = "error", children }) {
  if (!children) return null;
  const styles = {
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-green-50 border-green-200 text-green-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm mb-4 animate-fade-in-up ${styles[kind]}`}>{children}</div>
  );
}

export function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin align-[-3px] mr-2" />
  );
}

export function Skeleton({ lines = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-4 bg-slate-200 rounded" style={{ width: `${85 - i * 15}%`, animationDelay: `${i * 120}ms` }} />
      ))}
    </div>
  );
}

const CONDITION_STYLES = {
  acne: { badge: "bg-rose-100 text-rose-700", label: "Acne" },
  carcinoma: { badge: "bg-red-100 text-red-800", label: "Suspected Carcinoma" },
  eczema: { badge: "bg-amber-100 text-amber-700", label: "Eczema" },
  keratosis: { badge: "bg-orange-100 text-orange-700", label: "Keratosis" },
  milia: { badge: "bg-sky-100 text-sky-700", label: "Milia" },
  rosacea: { badge: "bg-pink-100 text-pink-700", label: "Rosacea" },
};
export function conditionStyle(c) { return CONDITION_STYLES[c] || { badge: "bg-slate-100 text-slate-700", label: c }; }

export function ConditionBadge({ condition, confidence }) {
  const s = conditionStyle(condition);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${s.badge}`}>
      {s.label}{confidence != null && ` · ${(confidence * 100).toFixed(0)}%`}
    </span>
  );
}

export function ProbabilityBar({ label, value, highlight }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className={`font-medium capitalize ${highlight ? "text-rose-700" : "text-slate-600"}`}>{label}</span>
        <span className="text-xs font-semibold text-slate-500">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${highlight ? "bg-gradient-to-r from-rose-600 to-orange-500" : "bg-slate-300"}`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

/** Small line chart with a soft area fill — used for admin trend reporting. */
export function TrendChart({ points, format = (v) => v, domain, color = "#be123c" }) {
  if (!points || points.length < 2) return <p className="text-xs text-slate-400">Not enough data yet.</p>;
  const values = points.map((p) => p.v).filter((v) => v != null);
  const [lo, hi] = domain || [Math.min(...values), Math.max(...values)];
  const range = hi - lo || 1;
  const W = 600, H = 160, PAD = 28;
  const xs = points.map((_, i) => PAD + (i / (points.length - 1)) * (W - PAD * 2));
  const ys = points.map((p) => H - PAD - ((p.v - lo) / range) * (H - PAD * 1.5));
  const path = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${path} L${xs[xs.length - 1]},${H - PAD} L${xs[0]},${H - PAD} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <path d={area} fill={color} opacity="0.08" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x={PAD} y={14} fontSize="10" fill="#94a3b8">{format(hi)}</text>
      <text x={PAD} y={H - PAD + 14} fontSize="10" fill="#94a3b8">{format(lo)}</text>
    </svg>
  );
}

/** Animated number that counts up to `value` on mount / when value changes. */
function CountUp({ value, decimals = 0, duration = 700 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display.toFixed(decimals)}</>;
}
export { CountUp };

export const fmtDate = (iso) =>
  new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
