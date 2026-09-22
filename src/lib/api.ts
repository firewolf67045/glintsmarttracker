// Base URL for scan endpoints. Locally and on the Lovable-hosted app this is
// same-origin (""). On external hosts (e.g. Vercel) set VITE_API_BASE to the
// hosted app URL (https://glinttracker.lovable.app) so scans use the working AI.
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      res.ok
        ? "Unexpected response from the scan service."
        : `Scan service unavailable (${res.status}). Try the hosted app at glinttracker.lovable.app.`,
    );
  }
  if (!res.ok) {
    const msg = (data as { error?: string })?.error;
    throw new Error(typeof msg === "string" ? msg : `Scan failed (${res.status})`);
  }
  return data as T;
}
