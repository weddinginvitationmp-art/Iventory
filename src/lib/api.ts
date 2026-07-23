import type { Item, Transaction } from './mockData'

const STORAGE_KEY = 'inventory-app-data-v2'
const FUNCTIONS_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

type PersistedState = {
  items: Item[]
  transactions: Transaction[]
}

function readLocalState(): PersistedState {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { items: [], transactions: [] }

    const parsed = JSON.parse(raw)
    return {
      items: Array.isArray(parsed?.items) ? parsed.items : [],
      transactions: Array.isArray(parsed?.transactions) ? parsed.transactions : [],
    }
  } catch {
    return { items: [], transactions: [] }
  }
}

function writeLocalState(state: PersistedState) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors
  }
}

function readAccessToken(): string {
  try {
    return window.sessionStorage.getItem('supabase_access_token') || ''
  } catch {
    return ''
  }
}

function normalizeItem(item: any): Item {
  return {
    ...item,
    id: item.id,
    name: item.name || 'Untitled item',
    sku: item.sku || `SKU-${item.id || 'new'}`,
    category: item.category || 'Điện tử',
    supplier: item.supplier || '',
    unit: item.unit || 'Cái',
    realStock: item.realStock ?? item.real_stock ?? 0,
    invoiceStock: item.invoiceStock ?? item.invoice_stock ?? 0,
    reorderPoint: item.reorderPoint ?? item.reorder_point ?? 0,
    costPrice: item.costPrice ?? item.cost_price ?? 0,
    sellPrice: item.sellPrice ?? item.sell_price ?? 0,
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
  }
}

function normalizeTransaction(tx: any): Transaction {
  return {
    ...tx,
    id: tx.id,
    type: tx.type || 'receive',
    itemId: tx.itemId || tx.item_id || '',
    itemName: tx.itemName || tx.item_name || tx.name || '',
    quantity: tx.quantity ?? 0,
    stockTarget: tx.stockTarget || tx.stock_type || 'both',
    note: tx.note || '',
    createdAt: tx.createdAt || tx.created_at || tx.date || new Date().toISOString(),
    createdBy: tx.createdBy || tx.created_by || 'Admin',
  }
}

function applyTransactionToItem(item: Item, tx: Transaction): Item {
  const quantity = Math.abs(tx.quantity)
  const delta = tx.quantity
  const target = tx.stockTarget || 'both'

  if (tx.type === 'receive' || tx.type === 'return') {
    if (target === 'real') {
      return { ...item, realStock: item.realStock + quantity }
    }
    if (target === 'invoice') {
      return { ...item, invoiceStock: item.invoiceStock + quantity }
    }
    return {
      ...item,
      realStock: item.realStock + quantity,
      invoiceStock: item.invoiceStock + quantity,
    }
  }

  if (tx.type === 'ship' || tx.type === 'adjust') {
    if (target === 'real') {
      return { ...item, realStock: item.realStock + delta }
    }
    if (target === 'invoice') {
      return { ...item, invoiceStock: item.invoiceStock + delta }
    }
    return {
      ...item,
      realStock: item.realStock + delta,
      invoiceStock: item.invoiceStock + delta,
    }
  }

  if (tx.type === 'transfer') {
    if (target === 'real') {
      return { ...item, realStock: item.realStock + delta }
    }
    if (target === 'invoice') {
      return { ...item, invoiceStock: item.invoiceStock + delta }
    }
    return {
      ...item,
      realStock: item.realStock + delta,
      invoiceStock: item.invoiceStock + delta,
    }
  }

  return item
}

async function apiRequest(path: string, init: RequestInit = {}): Promise<any> {
  const token = readAccessToken()
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${FUNCTIONS_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = 'Yêu cầu thất bại'
    try {
      const body = await response.json()
      message = body?.error || body?.message || message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

async function getUnifiedState(): Promise<PersistedState> {
  try {
    const [items, transactions] = await Promise.all([
      apiRequest('/items'),
      apiRequest('/transactions'),
    ])

    const remoteState: PersistedState = {
      items: Array.isArray(items) ? items.map(normalizeItem) : [],
      transactions: Array.isArray(transactions) ? transactions.map(normalizeTransaction) : [],
    }

    writeLocalState(remoteState)
    return remoteState
  } catch (error) {
    writeLocalState({ items: [], transactions: [] })
    throw error
  }
}

// ── Items ────────────────────────────────────────────────────────────────────

export async function fetchItems(): Promise<Item[]> {
  const state = await getUnifiedState()
  return state.items.map(normalizeItem)
}

export async function createItem(data: Omit<Item, 'id' | 'createdAt'>): Promise<Item> {
  const payload = {
    ...data,
    id: data.id || crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }

  try {
    const item = normalizeItem(await apiRequest('/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }))

    const state = readLocalState()
    writeLocalState({
      items: [item, ...state.items.filter((existing) => existing.id !== item.id)],
      transactions: state.transactions,
    })

    return item
  } catch {
    const fallbackItem = normalizeItem(payload)
    const state = readLocalState()
    writeLocalState({
      items: [fallbackItem, ...state.items.filter((existing) => existing.id !== fallbackItem.id)],
      transactions: state.transactions,
    })
    return fallbackItem
  }

}

export async function updateItem(id: string, data: Partial<Item>): Promise<Item> {
  const state = readLocalState()
  const current = state.items.find((item) => item.id === id)
  if (!current) throw new Error('Item not found')

  try {
    const updated = normalizeItem(await apiRequest(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...current,
        ...data,
        id,
        updatedAt: new Date().toISOString(),
      }),
    }))

    writeLocalState({
      items: state.items.map((item) => (item.id === id ? updated : item)),
      transactions: state.transactions,
    })

    return updated
  } catch {
    const updated = normalizeItem({ ...current, ...data, id })
    writeLocalState({
      items: state.items.map((item) => (item.id === id ? updated : item)),
      transactions: state.transactions,
    })
    return updated
  }
}

export async function deleteItem(id: string): Promise<void> {
  try {
    await apiRequest(`/items/${id}`, { method: 'DELETE' })
  } catch {
    // fall back to local state when backend is unavailable
  }

  const state = readLocalState()
  writeLocalState({
    items: state.items.filter((item) => item.id !== id),
    transactions: state.transactions,
  })
}

// ── Transactions ─────────────────────────────────────────────────────────────

export async function fetchTransactions(): Promise<Transaction[]> {
  const state = await getUnifiedState()
  return state.transactions.map(normalizeTransaction)
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  const payload = {
    ...data,
    id: data.id || crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }

  try {
    const tx = normalizeTransaction(await apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }))

    const state = readLocalState()
    const updatedItems = state.items.map((item) => {
      if (item.id !== tx.itemId) return item
      return applyTransactionToItem(item, tx)
    })

    writeLocalState({
      items: updatedItems,
      transactions: [tx, ...state.transactions.filter((existing) => existing.id !== tx.id)],
    })

    return tx
  } catch {
    const fallbackTx = normalizeTransaction(payload)
    const state = readLocalState()
    const updatedItems = state.items.map((item) => {
      if (item.id !== fallbackTx.itemId) return item
      return applyTransactionToItem(item, fallbackTx)
    })

    writeLocalState({
      items: updatedItems,
      transactions: [fallbackTx, ...state.transactions.filter((existing) => existing.id !== fallbackTx.id)],
    })
    return fallbackTx
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    await apiRequest(`/transactions/${id}`, { method: 'DELETE' })
  } catch {
    // fall back to local state when backend is unavailable
  }

  const state = readLocalState()
  writeLocalState({
    items: state.items,
    transactions: state.transactions.filter((tx) => tx.id !== id),
  })
}
