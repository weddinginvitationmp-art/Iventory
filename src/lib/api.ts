import { projectId } from '../../utils/supabase/info'
import { supabase } from './supabase'
import { MOCK_ITEMS, MOCK_TRANSACTIONS, type Item, type Transaction } from './mockData'

const BASES = [
  `https://${projectId}.supabase.co/functions/v1/smooth-handler`,
  `https://${projectId}.supabase.co/functions/v1/server`,
  `https://${projectId}.supabase.co/functions/v1/make-server-6ee7e975`,
]
const KV_TABLE = 'kv_store_e379089b'

function getAuthToken() {
  try {
    return localStorage.getItem('supabase_access_token') || ''
  } catch {
    return ''
  }
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

function parseBody(body: BodyInit | null | undefined): any {
  if (!body) return {}
  if (typeof body === 'string') {
    try { return JSON.parse(body) } catch { return {} }
  }
  return body
}

async function readFromKV(prefix: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from(KV_TABLE)
      .select('key, value')
      .like('key', `${prefix}%`)

    if (error) throw new Error(error.message)
    return (data ?? []).map((row: any) => row.value)
  } catch {
    if (prefix === 'item:') return MOCK_ITEMS
    if (prefix === 'transaction:') return MOCK_TRANSACTIONS
    return []
  }
}

async function readOneFromKV(key: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from(KV_TABLE)
      .select('key, value')
      .eq('key', key)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data?.value ?? null
  } catch {
    if (key.startsWith('item:')) {
      const item = MOCK_ITEMS.find((entry) => entry.id === key.replace('item:', ''))
      return item ?? null
    }
    if (key.startsWith('transaction:')) {
      const tx = MOCK_TRANSACTIONS.find((entry) => entry.id === key.replace('transaction:', ''))
      return tx ?? null
    }
    return null
  }
}

async function writeToKV(key: string, value: any): Promise<void> {
  try {
    const { error } = await supabase.from(KV_TABLE).upsert({ key, value })
    if (error) throw new Error(error.message)
  } catch {
    // ignore write failures and keep local UI working
  }
}

async function deleteFromKV(key: string): Promise<void> {
  try {
    const { error } = await supabase.from(KV_TABLE).delete().eq('key', key)
    if (error) throw new Error(error.message)
  } catch {
    // ignore delete failures and keep local UI working
  }
}

async function fallbackReq<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()

  if (path.startsWith('/items')) {
    if (method === 'GET') {
      return (await readFromKV('item:')) as T
    }

    if (method === 'POST') {
      const payload = parseBody(options.body)
      const id = payload?.id || crypto.randomUUID()
      const newItem = {
        ...payload,
        id,
        createdAt: new Date().toISOString(),
        realStock: payload.realStock ?? 0,
        invoiceStock: payload.invoiceStock ?? 0,
        reorderPoint: payload.reorderPoint ?? 0,
        supplier: payload.supplier || '',
        location: payload.location || '',
      }
      await writeToKV(`item:${id}`, newItem)
      return newItem as T
    }

    if (method === 'PUT') {
      const id = path.split('/').filter(Boolean).pop()
      const payload = parseBody(options.body)
      const existing = await readOneFromKV(`item:${id}`)
      if (!existing) throw new Error('Item not found')
      const updated = {
        ...existing,
        ...payload,
        updatedAt: new Date().toISOString(),
      }
      await writeToKV(`item:${id}`, updated)
      return updated as T
    }

    if (method === 'DELETE') {
      const id = path.split('/').filter(Boolean).pop()
      await deleteFromKV(`item:${id}`)
      return {} as T
    }
  }

  if (path.startsWith('/transactions')) {
    if (method === 'GET') {
      return (await readFromKV('transaction:')) as T
    }

    if (method === 'POST') {
      const payload = parseBody(options.body)
      const id = payload?.id || crypto.randomUUID()
      const newTx = {
        ...payload,
        id,
        createdAt: new Date().toISOString(),
        createdBy: payload.createdBy || 'Admin',
      }
      await writeToKV(`transaction:${id}`, newTx)
      return newTx as T
    }

    if (method === 'DELETE') {
      const id = path.split('/').filter(Boolean).pop()
      await deleteFromKV(`transaction:${id}`)
      return {} as T
    }
  }

  throw new Error(`No fallback handler for ${path}`)
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()

  for (const base of BASES) {
    try {
      const res = await fetch(base + path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}`, 'X-User-Token': token } : {}),
          ...options.headers,
        },
      })
      const payload = await res.text()
      let data: any = null
      try { data = payload ? JSON.parse(payload) : null } catch {}

      if (res.ok) {
        return data as T
      }

      if (res.status === 404 || res.status === 401 || res.status === 403) {
        continue
      }

      throw new Error(data?.error || `API ${path} failed: ${res.status}`)
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('404') || message.includes('401') || message.includes('403') || message.includes('Failed to fetch')) {
        continue
      }
      throw error
    }
  }

  return fallbackReq<T>(path, options)
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
