import { useState } from "react";
import { api, useApi } from "./api";
import {
  Alert, Button, Card, CountUp, Field, Skeleton, Spinner, TrendChart, fmtDate, inputCls,
} from "./ui";

export default function AdminPortal({ tab }) {
  switch (tab) {
    case "reports": return <Reports />;
    case "users": return <Users />;
    case "catalog": return <Catalog />;
    case "model": return <Model />;
    default: return null;
  }
}

const CONDITIONS = ["acne", "carcinoma", "eczema", "keratosis", "milia", "rosacea"];
const CATEGORIES = ["cleanser", "treatment", "moisturizer", "sunscreen", "medical"];

// ---- System Reports -----------------------------------------------------------------

function Reports() {
  const { data, loading, error } = useApi("/api/admin/reports");
  if (loading) return <Card><Skeleton lines={4} /></Card>;
  if (error) return <Alert>{error}</Alert>;

  const trendPoints = data.analyses_per_day.map((d) => ({ t: d.date, v: d.count }));

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-6">
        <Card title="Registered users">
          <p className="text-4xl font-bold text-indigo-900"><CountUp value={data.total_users} /></p>
        </Card>
        <Card title="Total analyses">
          <p className="text-4xl font-bold text-indigo-900"><CountUp value={data.total_analyses} /></p>
        </Card>
        <Card title="Urgent referrals flagged">
          <p className="text-4xl font-bold text-red-700"><CountUp value={data.urgent_referrals} /></p>
        </Card>
      </div>

      <Card title="Analyses per day (last 14 days)">
        <TrendChart points={trendPoints} color="#4338ca" format={(v) => Math.round(v)} />
      </Card>

      <Card title="Condition distribution">
        <div className="space-y-3">
          {Object.entries(data.condition_distribution).map(([cond, count]) => {
            const max = Math.max(...Object.values(data.condition_distribution), 1);
            return (
              <div key={cond}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700 capitalize">{cond}</span>
                  <span className="text-xs font-semibold text-slate-500">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-700 to-slate-600" style={{ width: `${(count / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ---- Manage Users --------------------------------------------------------------------

function Users() {
  const { data, loading, error, reload } = useApi("/api/admin/users");
  const [busyId, setBusyId] = useState(null);

  if (loading) return <Card><Skeleton lines={4} /></Card>;
  if (error) return <Alert>{error}</Alert>;
  if (!data.length) return <Card><p className="text-sm text-slate-400">No registered users yet.</p></Card>;

  const toggle = async (id) => {
    setBusyId(id);
    try { await api(`/api/admin/users/${id}/block`, { method: "PUT" }); reload(); } finally { setBusyId(null); }
  };

  return (
    <Card title={`Registered users (${data.length})`}>
      <div className="space-y-2 max-h-[32rem] overflow-y-auto">
        {data.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
            <div>
              <p className="text-sm font-medium text-slate-700">{u.full_name}</p>
              <p className="text-xs text-slate-400">{u.email} · joined {fmtDate(u.created_at)}</p>
            </div>
            <Button
              variant={u.is_blocked ? "success" : "danger"}
              className="text-xs px-3 py-1"
              onClick={() => toggle(u.id)}
              disabled={busyId === u.id}
            >
              {busyId === u.id && <Spinner />}{u.is_blocked ? "Unblock" : "Block"}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---- Manage Products (catalog CRUD) --------------------------------------------------

function Catalog() {
  const { data, loading, error, reload } = useApi("/api/admin/products");
  const [form, setForm] = useState({ name: "", condition: "acne", category: "cleanser", description: "", usage_instructions: "" });
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({ name: p.name, condition: p.condition, category: p.category, description: p.description, usage_instructions: p.usage_instructions });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", condition: "acne", category: "cleanser", description: "", usage_instructions: "" });
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      if (editingId) await api(`/api/admin/products/${editingId}`, { method: "PUT", body: form });
      else await api("/api/admin/products", { method: "POST", body: form });
      cancelEdit();
      reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    await api(`/api/admin/products/${id}`, { method: "DELETE" });
    if (editingId === id) cancelEdit();
    reload();
  };

  return (
    <div className="space-y-6">
      <Card title={editingId ? "Edit product" : "Add a product"}>
        <Alert>{formError}</Alert>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <Field label="Name">
            <input className={inputCls} value={form.name} onChange={set("name")} required minLength={2} />
          </Field>
          <Field label="Condition">
            <select className={inputCls} value={form.condition} onChange={set("condition")}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select className={inputCls} value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Usage instructions">
            <input className={inputCls} value={form.usage_instructions} onChange={set("usage_instructions")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea rows={2} className={inputCls} value={form.description} onChange={set("description")} />
            </Field>
          </div>
          <div className="sm:col-span-2 flex gap-3">
            <Button type="submit" variant="admin" disabled={busy}>{busy && <Spinner />}{editingId ? "Save changes" : "Add product"}</Button>
            {editingId && <Button type="button" variant="subtle" onClick={cancelEdit}>Cancel</Button>}
          </div>
        </form>
      </Card>

      <Card title={`Product catalog (${data?.length || 0})`}>
        {loading ? <Skeleton lines={4} /> : error ? <Alert>{error}</Alert> : !data.length ? (
          <p className="text-sm text-slate-400">No products yet.</p>
        ) : (
          <div className="space-y-2 max-h-[32rem] overflow-y-auto">
            {data.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{p.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{p.condition} · {p.category}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="subtle" className="text-xs px-3 py-1" onClick={() => startEdit(p)}>Edit</Button>
                  <Button variant="danger" className="text-xs px-3 py-1" onClick={() => remove(p.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- Monitor AI Model -----------------------------------------------------------------

function Model() {
  const { data, loading, error } = useApi("/api/admin/model");
  if (loading) return <Card><Skeleton lines={4} /></Card>;
  if (error) return <Alert>{error}</Alert>;

  const up = data.health?.status === "ok" && data.health?.model_loaded;

  return (
    <div className="space-y-6">
      <Card title="Service health">
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
          <span className={`w-2 h-2 rounded-full ${up ? "bg-emerald-500" : "bg-red-500"}`} />
          {up ? "Model loaded and serving" : "ML service unavailable"}
        </span>
      </Card>

      {data.metadata && (
        <Card title="Model metadata">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-slate-400">Model</p><p className="font-medium text-slate-700">{data.metadata.model}</p></div>
            <div><p className="text-xs text-slate-400">License</p><p className="font-medium text-slate-700">{data.metadata.license}</p></div>
            <div><p className="text-xs text-slate-400">Reported test accuracy</p><p className="font-medium text-slate-700">{(data.metadata.reported_test_accuracy * 100).toFixed(1)}%</p></div>
            <div><p className="text-xs text-slate-400">Explainability method</p><p className="font-medium text-slate-700">{data.metadata.explainability}</p></div>
            <div className="sm:col-span-2"><p className="text-xs text-slate-400">Classes</p><p className="font-medium text-slate-700 capitalize">{data.metadata.classes.join(", ")}</p></div>
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-400">Source</p>
              <a href={data.metadata.source} target="_blank" rel="noreferrer" className="font-medium text-indigo-700 hover:underline break-all">{data.metadata.source}</a>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
