import { useEffect, useState } from "react";
import { api, apiUpload, mediaUrl, useApi } from "./api";
import {
  Alert, Button, Card, ConditionBadge, CountUp, Field, ProbabilityBar,
  Skeleton, Spinner, conditionStyle, fmtDate, inputCls,
} from "./ui";

export default function UserPortal({ tab, onNavigate }) {
  switch (tab) {
    case "dashboard": return <Dashboard onNavigate={onNavigate} />;
    case "analyze": return <Analyze onNavigate={onNavigate} />;
    case "explain": return <Explain />;
    case "recommend": return <Recommend />;
    case "history": return <History />;
    case "profile": return <Profile />;
    default: return null;
  }
}

// ---- Dashboard ------------------------------------------------------------------

function Dashboard({ onNavigate }) {
  const latest = useApi("/api/analysis/latest");
  const history = useApi("/api/analysis/history");

  if (latest.loading || history.loading) return <Card><Skeleton lines={4} /></Card>;
  if (latest.error) return <Alert>{latest.error}</Alert>;

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {latest.data?.urgent_referral && (
        <div className="sm:col-span-2 bg-red-50 border border-red-300 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3 animate-fade-in-up">
          <div>
            <p className="font-bold text-red-700">Urgent referral suggested</p>
            <p className="text-sm text-red-600">Your latest analysis flagged a pattern that warrants an in-person dermatologist review.</p>
          </div>
          <Button variant="danger" onClick={() => onNavigate?.("recommend")}>View details</Button>
        </div>
      )}

      <Card title="Latest analysis">
        {latest.data ? (
          <>
            <ConditionBadge condition={latest.data.condition} confidence={latest.data.confidence} />
            <p className="text-xs text-slate-400 mt-3">Analyzed {fmtDate(latest.data.created_at)}</p>
          </>
        ) : (
          <p className="text-sm text-slate-400">No analysis yet — upload a photo to get started.</p>
        )}
      </Card>

      <Card title="Total analyses">
        <p className="text-4xl font-bold text-rose-900"><CountUp value={history.data?.length || 0} /></p>
        <p className="text-sm text-slate-400 mt-1">Skin images analyzed since account creation.</p>
      </Card>

      <Card title="Analyze a new image" className="sm:col-span-2">
        <p className="text-sm text-slate-500 mb-4">Upload a clear, well-lit facial photo for an instant AI skin condition analysis.</p>
        <Button onClick={() => onNavigate?.("analyze")}>Upload & Analyze</Button>
      </Card>
    </div>
  );
}

// ---- Analyze (upload -> validate -> predict -> gradcam -> recommend -> display) --

function Analyze({ onNavigate }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const pick = (e) => {
    const f = e.target.files?.[0];
    setError("");
    setResult(null);
    if (!f) return setFile(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Please choose a JPEG, PNG or WEBP image.");
      setFile(null);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Choose an image first.");
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await apiUpload("/api/analysis/upload", formData);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Upload a skin image">
        <Alert>{error}</Alert>
        <form onSubmit={submit} className="space-y-4">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="text-sm" />
          {preview && (
            <img src={preview} alt="Preview" className="w-40 h-40 object-cover rounded-xl border border-slate-200" />
          )}
          <Button type="submit" disabled={busy || !file}>{busy && <Spinner />}Analyze image</Button>
        </form>
      </Card>

      {result && (
        <div className="grid sm:grid-cols-2 gap-6 animate-fade-in-up">
          <Card title="Original image">
            <img src={mediaUrl(result.image_url)} alt="Uploaded skin" className="w-full rounded-xl border border-slate-200" />
          </Card>
          <Card title="Grad-CAM explanation">
            {result.gradcam_url && <img src={mediaUrl(result.gradcam_url)} alt="Grad-CAM heatmap" className="w-full rounded-xl border border-slate-200" />}
          </Card>

          <Card title="Result" className="sm:col-span-2">
            <ConditionBadge condition={result.condition} confidence={result.confidence} />
            {result.urgent_referral && (
              <p className="mt-3 text-sm font-semibold text-red-700">
                This result pattern warrants an in-person evaluation by a board-certified dermatologist.
              </p>
            )}
            <div className="mt-4 space-y-2">
              {result.reasons.map((r, i) => (
                <p key={i} className="text-sm text-slate-600">{r.detail}</p>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <Button variant="subtle" onClick={() => onNavigate?.("explain")}>View full explanation</Button>
              <Button variant="subtle" onClick={() => onNavigate?.("recommend")}>View recommendations</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ---- Explain (Grad-CAM + probabilities for a chosen past analysis) ---------------

function Explain() {
  const { data, loading, error } = useApi("/api/analysis/history");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (data?.length && !selected) setSelected(data[0].id);
  }, [data, selected]);

  if (loading) return <Card><Skeleton lines={4} /></Card>;
  if (error) return <Alert>{error}</Alert>;
  if (!data.length) return <Card><p className="text-sm text-slate-400">No analyses to explain yet — analyze an image first.</p></Card>;

  const item = data.find((a) => a.id === selected) || data[0];

  return (
    <div className="space-y-6">
      <Card title="Select an analysis">
        <select className={inputCls} value={selected || ""} onChange={(e) => setSelected(e.target.value)}>
          {data.map((a) => (
            <option key={a.id} value={a.id}>
              {fmtDate(a.created_at)} — {conditionStyle(a.condition).label} ({(a.confidence * 100).toFixed(0)}%)
            </option>
          ))}
        </select>
      </Card>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card title="Original image">
          <img src={mediaUrl(item.image_url)} alt="Uploaded skin" className="w-full rounded-xl border border-slate-200" />
        </Card>
        <Card title="Grad-CAM heatmap">
          {item.gradcam_url && <img src={mediaUrl(item.gradcam_url)} alt="Grad-CAM heatmap" className="w-full rounded-xl border border-slate-200" />}
          <p className="text-xs text-slate-400 mt-2">Warmer colors show where the model focused most to reach its conclusion.</p>
        </Card>
      </div>

      <Card title="Why the AI reached this conclusion">
        <ConditionBadge condition={item.condition} confidence={item.confidence} />
        <div className="mt-4 space-y-2">
          {item.reasons.map((r, i) => (
            <p key={i} className="text-sm text-slate-600">{r.detail}</p>
          ))}
        </div>
      </Card>

      <Card title="Class probabilities">
        <div className="space-y-3">
          {Object.entries(item.probabilities).sort((a, b) => b[1] - a[1]).map(([cls, p]) => (
            <ProbabilityBar key={cls} label={cls} value={p} highlight={cls === item.condition} />
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---- Recommend (skincare products for a chosen past analysis) --------------------

function Recommend() {
  const { data, loading, error } = useApi("/api/analysis/history");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (data?.length && !selected) setSelected(data[0].id);
  }, [data, selected]);

  if (loading) return <Card><Skeleton lines={4} /></Card>;
  if (error) return <Alert>{error}</Alert>;
  if (!data.length) return <Card><p className="text-sm text-slate-400">No recommendations yet — analyze an image first.</p></Card>;

  const item = data.find((a) => a.id === selected) || data[0];

  return (
    <div className="space-y-6">
      <Card title="Select an analysis">
        <select className={inputCls} value={selected || ""} onChange={(e) => setSelected(e.target.value)}>
          {data.map((a) => (
            <option key={a.id} value={a.id}>
              {fmtDate(a.created_at)} — {conditionStyle(a.condition).label} ({(a.confidence * 100).toFixed(0)}%)
            </option>
          ))}
        </select>
      </Card>

      {item.urgent_referral ? (
        <Card>
          <p className="font-semibold text-red-700">Please see a board-certified dermatologist</p>
          <p className="text-sm text-slate-600 mt-2">
            This result pattern is not one this tool provides cosmetic recommendations for. Please book an
            in-person evaluation promptly — this app does not diagnose skin cancer.
          </p>
        </Card>
      ) : item.recommended_products.length === 0 ? (
        <Card><p className="text-sm text-slate-400">No matching products in the catalog yet.</p></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {item.recommended_products.map((p, i) => (
            <div key={p.id} className="stagger-item" style={{ animationDelay: `${i * 90}ms` }}>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">{p.category}</p>
                <p className="font-semibold text-slate-800 mt-1">{p.name}</p>
                <p className="text-sm text-slate-600 mt-2">{p.description}</p>
                {p.usage_instructions && (
                  <p className="text-xs text-slate-400 mt-2">💡 {p.usage_instructions}</p>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- History ----------------------------------------------------------------------

function History() {
  const { data, loading, error } = useApi("/api/analysis/history");
  if (loading) return <Card><Skeleton lines={4} /></Card>;
  if (error) return <Alert>{error}</Alert>;
  if (!data.length) return <Card><p className="text-sm text-slate-400">No analyses yet.</p></Card>;

  return (
    <Card title={`Analysis history (${data.length})`}>
      <div className="space-y-2 max-h-[32rem] overflow-y-auto">
        {data.map((a, i) => (
          <div key={a.id} className="stagger-item flex items-center gap-4 py-2.5 border-b border-slate-100 last:border-0" style={{ animationDelay: `${Math.min(i, 10) * 60}ms` }}>
            <img src={mediaUrl(a.image_url)} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">{conditionStyle(a.condition).label}</p>
              <p className="text-xs text-slate-400">{fmtDate(a.created_at)}</p>
            </div>
            <ConditionBadge condition={a.condition} confidence={a.confidence} />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---- Profile ------------------------------------------------------------------------

function Profile() {
  const { data, loading, error, reload } = useApi("/api/auth/me");
  const [form, setForm] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data && !form) setForm({ full_name: data.full_name, age: data.age ?? "", skin_type: data.skin_type || "" });
  }, [data, form]);

  if (loading || !form) return <Card><Skeleton lines={4} /></Card>;
  if (error) return <Alert>{error}</Alert>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaveError("");
    setBusy(true);
    try {
      await api("/api/auth/me", {
        method: "PUT",
        body: { full_name: form.full_name, age: form.age ? Number(form.age) : null, skin_type: form.skin_type },
      });
      reload();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Your details">
      <Alert>{saveError}</Alert>
      <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name">
          <input className={inputCls} value={form.full_name} onChange={set("full_name")} required minLength={2} />
        </Field>
        <Field label="Email">
          <input className={`${inputCls} bg-slate-50 text-slate-400`} value={data.email} disabled />
        </Field>
        <Field label="Age">
          <input type="number" min={1} max={120} className={inputCls} value={form.age} onChange={set("age")} />
        </Field>
        <Field label="Skin type">
          <select className={inputCls} value={form.skin_type} onChange={set("skin_type")}>
            {["", "oily", "dry", "combination", "normal", "sensitive"].map((t) => (
              <option key={t} value={t}>{t ? t[0].toUpperCase() + t.slice(1) : "Not sure"}</option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy}>{busy && <Spinner />}Save changes</Button>
        </div>
      </form>
    </Card>
  );
}
