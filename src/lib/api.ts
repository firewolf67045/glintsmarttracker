// All scans go to the hosted Glint scan service, which has the AI configured.
// This is hardcoded on purpose so copies hosted elsewhere (e.g. Vercel) work
// without any environment variable — a wrong/empty VITE_API_BASE can't break it.
const API_BASE = "https://glinttracker.lovable.app";

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
        : `Scan service unavailable (${res.status}). Please try again in a moment.`,
    );
  }
  if (!res.ok) {
    const msg = (data as { error?: string })?.error;
    throw new Error(typeof msg === "string" ? msg : `Scan failed (${res.status})`);
  }
  return data as T;
}
