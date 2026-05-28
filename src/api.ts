import { supabase, projectId, publicAnonKey } from "./supabase";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-50588193`;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || publicAnonKey}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // ADMIN: List all users with their roles
  getUsers: () => fetchWithAuth('/users'),

  // ADMIN: Toggle verify status
  verifyUser: (id: string, verified: boolean) => fetchWithAuth('/admin/verify', {
    method: 'POST',
    body: JSON.stringify({ id, verified }),
  }),

  // ADMIN: Update user
  updateUser: (id: string, data: { name?: string; email?: string }) => fetchWithAuth(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // ADMIN: Delete user
  deleteUser: (id: string) => fetchWithAuth(`/admin/users/${id}`, {
    method: 'DELETE',
  }),
};
