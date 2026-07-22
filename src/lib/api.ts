import { projectId } from '../../utils/supabase/info'
import { type Item, type Transaction } from './mockData'

const BASES = [
  `https://${projectId}.supabase.co/functions/v1/smooth-handler`,
  `https://${projectId}.supabase.co/functions/v1/server`,
  `https://${projectId}.supabase.co/functions/v1/make-server-6ee7e975`,
]

function getAuthToken() {
  const token = localStorage.getItem('supabase_access_token')
  if (!token) throw new Error('Không xác thực được người dùng')
  return token
}

function normalizeItem(item: any): Item {
  return {
    ...item,
    id: item.id,
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    realStock: item.realStock ?? item.real_stock ?? 0,
    invoiceStock: item.invoiceStock ?? item.invoice_stock ?? 0,
    reorderPoint: item.reorderPoint ?? item.reorder_point ?? 0,
    costPrice: item.costPrice ?? item.cost_price ?? 0,
    sellPrice: item.sellPrice ?? item.sell_price ?? 0,
  }
}

function normalizeTransaction(tx: any): Transaction {
  return {
    ...tx,
    id: tx.id,
    itemId: tx.itemId || tx.item_id || '',
    itemName: tx.itemName || tx.item_name || tx.name || '',
    quantity: tx.quantity ?? 0,
    stockTarget: tx.stockTarget || tx.stock_type || 'both',
    note: tx.note || '',
    createdAt: tx.createdAt || tx.created_at || tx.date || new Date().toISOString(),
    createdBy: tx.createdBy || tx.created_by || 'Admin',
  }
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  let lastError: Error | null = null
  const token = getAuthToken()

  for (const base of BASES) {
    try {
      const res = await fetch(base + path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-Token': token,
          ...options.headers,
        },
      })
      const payload = await res.text()
      let data: any = null
      try { data = payload ? JSON.parse(payload) : null } catch {}

      if (res.ok) {
        return data as T
      }

      if (res.status === 404) {
        continue
      }

      throw new Error(data?.error || `API ${path} failed: ${res.status}`)
    } catch (error) {
      lastError = error as Error
      if ((error as Error).message.includes('404')) {
        continue
      }
      throw error
    }
  }

  throw lastError || new Error(`API ${path} failed: all function URLs returned 404`)
}

// ── Items ────────────────────────────────────────────────────────────────────

export async function fetchItems(): Promise<Item[]> {
  const data = await req<any[]>('/items')
  return (Array.isArray(data) ? data : []).map(normalizeItem)
}

export async function createItem(data: Omit<Item, 'id' | 'createdAt'>): Promise<Item> {
  return normalizeItem(await req<any>('/items', { method: 'POST', body: JSON.stringify(data) }))
}

export async function updateItem(id: string, data: Partial<Item>): Promise<Item> {
  return normalizeItem(await req<any>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }))
}

export async function deleteItem(id: string): Promise<void> {
  await req(`/items/${id}`, { method: 'DELETE' })
}

// ── Transactions ─────────────────────────────────────────────────────────────

export async function fetchTransactions(): Promise<Transaction[]> {
  const data = await req<any[]>('/transactions')
  return (Array.isArray(data) ? data : []).map(normalizeTransaction)
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  return normalizeTransaction(await req<any>('/transactions', { method: 'POST', body: JSON.stringify(data) }))
}

export async function deleteTransaction(id: string): Promise<void> {
  await req(`/transactions/${id}`, { method: 'DELETE' })
}
