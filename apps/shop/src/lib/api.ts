const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
// Guard against env vars saved without a protocol (e.g. "backend.onrender.com").
// Without "https://", fetch() treats the value as a relative path and prepends
// the current page's locale segment, producing broken URLs like "/en/backend.../api/...".
const API_URL = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;

function getToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('vitamin_token='))
    ?.split('=')[1];
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error((body as { message?: string }).message ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}
