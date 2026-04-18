import { supabase } from "./supabase";
import { projectId } from "/utils/supabase/info";

export const API_BASE = `https://${projectId}.supabase.co/functions/v1/smooth-handler`;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) throw new Error("No active session");

  const headers = new Headers(options.headers);
  // Use anon key instead of session token to avoid ES256 verification issues
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZm56bmF6Ym9pbWJ6bHBjbmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTQyNzMsImV4cCI6MjA5MjA3MDI3M30.6WN4uQXBXpHRGL8gJr4OyBYgxAEzG5sbW-1Q7JRLeRM';
  headers.set("Authorization", `Bearer ${anonKey}`);
  headers.set("X-User-Token", token); // Pass real token in custom header
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

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
  getItems: () => fetchWithAuth("/items"),
  createItem: (data: any) => fetchWithAuth("/items", { method: "POST", body: JSON.stringify(data) }),
  updateItem: (id: string, data: any) => fetchWithAuth(`/items/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteItem: (id: string) => fetchWithAuth(`/items/${id}`, { method: "DELETE" }),
  
  getTransactions: () => fetchWithAuth("/transactions"),
  createTransaction: (data: any) => fetchWithAuth("/transactions", { method: "POST", body: JSON.stringify(data) }),

  // Import items from Excel/CSV
  importItems: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) throw new Error("No active session");
    
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZm56bmF6Ym9pbWJ6bHBjbmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTQyNzMsImV4cCI6MjA5MjA3MDI3M30.6WN4uQXBXpHRGL8gJr4OyBYgxAEzG5sbW-1Q7JRLeRM';
    
    const response = await fetch(`${API_BASE}/import-items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'X-User-Token': token
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};