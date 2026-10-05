import "server-only";

// BACKEND_URL is injected automatically by the Vercel Services binding
// declared in vercel.json — the Python backend has no public rewrite, so
// this is the only way to reach it, and only from server-side code.
function backendUrl(path: string): URL {
  const base = process.env.BACKEND_URL;
  if (!base) {
    throw new Error(
      "BACKEND_URL is not set — the 'backend' service binding is missing or not available in this environment.",
    );
  }
  return new URL(path, base);
}

export class BackendError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`Backend request failed with ${status}: ${body}`);
    this.status = status;
    this.body = body;
  }
}

type CallBackendOptions = {
  method?: string;
  body?: unknown;
  clientIp?: string | null;
  searchParams?: Record<string, string | undefined>;
};

export async function callBackend<T>(
  path: string,
  options: CallBackendOptions = {},
): Promise<T> {
  const url = backendUrl(path);

  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.clientIp) headers["X-Client-IP"] = options.clientIp;

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new BackendError(response.status, text);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
