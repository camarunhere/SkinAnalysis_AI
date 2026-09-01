import { useState } from "react";
import { api, storeSession } from "./api";
import { Alert, Button, Field, Spinner, inputCls } from "./ui";
import Background, { BG_TINTS } from "./Background";

const SKIN_TYPES = ["", "oily", "dry", "combination", "normal", "sensitive"];

export default function AuthPage({ onLogin, onBack }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ full_name: "", email: "", password: "", age: "", skin_type: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email: form.email, password: form.password }
          : { ...form, age: form.age ? Number(form.age) : null };
      const data = await api(path, { method: "POST", body });
      storeSession(data.token, data.user);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`min-h-screen ${BG_TINTS.scan} flex items-center justify-center px-4 py-10`}>
      <Background variant="scan" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <button onClick={onBack} className="text-xs text-slate-500 hover:text-rose-800 mb-3">← Back to home</button>
          <div className="text-4xl mb-2">🔬</div>
          <h1 className="text-2xl font-bold text-rose-950">AI Skin Analysis</h1>
          <p className="text-sm text-slate-500 mt-1">Login or create your account</p>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-white/70 rounded-2xl shadow-2xl shadow-rose-900/10 p-7 animate-fade-in-up">
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold capitalize transition ${
                  mode === m ? "bg-white shadow text-slate-900" : "text-slate-500"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <Alert>{error}</Alert>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <Field label="Full name">
                <input className={inputCls} value={form.full_name} onChange={set("full_name")} required minLength={2} />
              </Field>
            )}
            <Field label="Email">
              <input type="email" className={inputCls} value={form.email} onChange={set("email")} required />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input type={showPw ? "text" : "password"} className={`${inputCls} pr-16`} value={form.password} onChange={set("password")} required minLength={6} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 transition">
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </Field>
            {mode === "register" && (
              <>
                <Field label="Age (optional)">
                  <input type="number" className={inputCls} value={form.age} onChange={set("age")} min={1} max={120} />
                </Field>
                <Field label="Skin type (optional)">
                  <select className={inputCls} value={form.skin_type} onChange={set("skin_type")}>
                    {SKIN_TYPES.map((t) => (
                      <option key={t} value={t}>{t ? t[0].toUpperCase() + t.slice(1) : "Not sure"}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}
            <Button type="submit" className="w-full py-3" disabled={busy}>
              {busy && <Spinner />}{mode === "login" ? "Login" : "Create account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
