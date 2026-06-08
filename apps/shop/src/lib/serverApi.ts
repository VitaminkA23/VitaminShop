import { cookies } from 'next/headers';

const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_URL = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;

export async function serverApiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const cookieStore = cookies();
  const token = cookieStore.get('vitamin_token')?.value;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: 'no-store',
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