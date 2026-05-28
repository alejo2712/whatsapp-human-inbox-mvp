import { api } from './api';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function login(email: string, password: string): Promise<CurrentUser> {
  return api.post<CurrentUser>('/auth/login', { email, password });
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout', {});
}

export async function getMe(): Promise<CurrentUser | null> {
  try {
    return await api.get<CurrentUser>('/auth/me');
  } catch {
    return null;
  }
}
