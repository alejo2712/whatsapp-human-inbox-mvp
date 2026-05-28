import { cookies } from 'next/headers';
import { api } from './api';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function login(email: string, password: string): Promise<CurrentUser> {
  return api.post<CurrentUser>('/auth/login', { email, password });
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout', {});
}

// Server-side only — forwards the access_token cookie from the incoming request
export async function getMe(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;

    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Cookie: `access_token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<CurrentUser>;
  } catch {
    return null;
  }
}
