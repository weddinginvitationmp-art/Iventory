import { supabase } from "./supabase";
import { projectId } from "/utils/supabase/info";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/smooth-handler`;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (!token) throw new Error("No active session");
  
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
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
  createTransaction: (data: any) => fetchWithAuth("/transactions", { method: "POST", body: JSON.stringify(data) })
};