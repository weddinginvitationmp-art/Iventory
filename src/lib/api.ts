import { projectId } from '../../utils/supabase/info'
import { type Item, type Transaction } from './mockData'

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6ee7e975`

function getAuthToken() {
  const token = localStorage.getItem('supabase_access_token')
  if (!token) throw new Error('Không xác thực được người dùng')
  return token
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Token': getAuthToken(),
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json()
}

// ── Items ────────────────────────────────────────────────────────────────────

export async function fetchItems(): Promise<Item[]> {
  return req('/items')
}

export async function createItem(data: Omit<Item, 'id' | 'createdAt'>): Promise<Item> {
  return req('/items', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateItem(id: string, data: Partial<Item>): Promise<Item> {
  return req(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteItem(id: string): Promise<void> {
  return req(`/items/${id}`, { method: 'DELETE' })
}

// ── Transactions ─────────────────────────────────────────────────────────────

export async function fetchTransactions(): Promise<Transaction[]> {
  return req('/transactions')
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  return req('/transactions', { method: 'POST', body: JSON.stringify(data) })
}

export async function deleteTransaction(id: string): Promise<void> {
  return req(`/transactions/${id}`, { method: 'DELETE' })
}
