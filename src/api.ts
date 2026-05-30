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
  getUsers: () => fetchWithAuth('/admin/users'),

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

  // ADMIN: Get raw auth users
  getAuthUsers: () => fetchWithAuth('/admin/auth-users'),

  // ADMIN: Get live feed
  getJobs: () => fetchWithAuth('/jobs'),
  getAllApplications: () => fetchWithAuth('/admin/applications'),

  // ADMIN: Job Moderation
  deleteJob: (id: string) => fetchWithAuth(`/admin/jobs/${id}`, { method: 'DELETE' }),

  // ADMIN: Announcements
  sendAnnouncement: (data: { title: string; message: string }) => fetchWithAuth('/admin/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // ADMIN: FAQ Management
  getFaqs: () => fetchWithAuth('/faq'),
  createFaq: (data: any) => fetchWithAuth('/admin/faqs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateFaq: (id: string, data: any) => fetchWithAuth(`/admin/faqs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteFaq: (id: string) => fetchWithAuth(`/admin/faqs/${id}`, { method: 'DELETE' }),

  // ADMIN: Support Tickets
  getTickets: () => fetchWithAuth('/admin/tickets'),
  replyToTicket: (id: string, message: string) => fetchWithAuth(`/admin/tickets/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
  updateTicketStatus: (id: string, status: string) => fetchWithAuth(`/admin/tickets/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  }),

  // ADMIN: Finance & Earnings
  getEarnings: () => fetchWithAuth('/admin/earnings'),
  processPayout: (userId: string, txId: string) => fetchWithAuth(`/admin/payouts/${userId}/${txId}`, {
    method: 'POST',
  }),

  // ADMIN: User Suspension
  suspendUser: (id: string, suspended: boolean) => fetchWithAuth(`/admin/users/${id}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ suspended }),
  }),
};
