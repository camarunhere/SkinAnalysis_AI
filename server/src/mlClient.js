const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:5001";

async function callJson(path, opts) {
  const res = await fetch(`${ML_URL}${path}`, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.detail || `ML service error (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const mlHealth = () => callJson("/health");
export const mlMetadata = () => callJson("/metadata");

export const mlAnalyze = (imageBase64) =>
  callJson("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
