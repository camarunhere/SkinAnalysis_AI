import { useEffect, useState, useCallback } from "react";

const TOKEN_KEY = "ska_token";
const USER_KEY = "ska_user";

// When the frontend is deployed separately from the backend (e.g. frontend on
// Vercel, backend on Render), set VITE_API_URL to the backend's full URL
// (e.g. https://skinanalysis-api.onrender.com). Left unset, requests go to
// the same origin the frontend is served from — used for local dev (via the
// Vite proxy) and combined deployments where one server serves both.
const API_BASE = import.meta.env.VITE_API_URL || "";

/** Prefixes a `/uploads/...` path from the API with the backend's origin, so
 * <img> tags work when the frontend and backend are on different domains. */
export const mediaUrl = (path) => (path ? `${API_BASE}${path}` : path);

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};
export const storeSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

async function handleResponse(res, token) {
  if (res.status === 401 && token) {
    clearSession();
    window.location.reload();
    return new Promise(() => {});
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") detail = data.detail;
    } catch { /* keep default */ }
    throw new Error(detail);
  }
  return res.json();
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return handleResponse(res, token);
}

/** POST a file (FormData) — used for image upload/analysis. */
export async function apiUpload(path, formData) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { method: "POST", headers, body: formData });
  return handleResponse(res, token);
}

/** GET `path` on mount (and whenever it changes), tracking loading/error state.
 * Pass `path` as null/false to skip. Call the returned `reload()` to refetch. */
export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: !!path, error: "" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    api(path)
      .then((data) => alive && setState({ data, loading: false, error: "" }))
      .catch((err) => alive && setState({ data: null, loading: false, error: err.message }));
    return () => { alive = false; };
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
