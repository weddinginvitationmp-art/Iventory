import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const KV_TABLE = 'kv_store_e379089b'

function withCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Token')
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return {}
}

function getResourceId(req) {
  const pathname = req.url?.split('?')[0] || '/'
  const segments = pathname.split('/').filter(Boolean)
  const index = segments.findIndex((segment) => segment === 'transactions')
  if (index >= 0 && segments[index + 1]) return segments[index + 1]
  return req.params?.id || req.query?.id || null
}

function createSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(supabaseUrl, serviceRoleKey)
}

function getTransactionDelta(tx, reverse = false) {
  const value = (tx.type === 'receive' || tx.type === 'return')
    ? Math.abs(tx.quantity ?? 0)
    : (tx.quantity ?? 0)
  return reverse ? -value : value
}

function applyTransactionToItem(item, tx, reverse = false) {
  const delta = getTransactionDelta(tx, reverse)
  const target = tx.stockTarget || 'both'

  if (target === 'real') {
    return { ...item, realStock: (item.realStock ?? 0) + delta }
  }

  if (target === 'invoice') {
    return { ...item, invoiceStock: (item.invoiceStock ?? 0) + delta }
  }

  return {
    ...item,
    realStock: (item.realStock ?? 0) + delta,
    invoiceStock: (item.invoiceStock ?? 0) + delta,
  }
}

async function updateItemStockForTransaction(supabase, tx, reverse = false) {
  const itemId = tx?.itemId || tx?.item_id
  if (!itemId) return

  const { data, error } = await supabase.from(KV_TABLE).select('key, value').eq('key', `item:${itemId}`).maybeSingle()
  if (error) throw error
  if (!data?.value) return

  const updatedItem = applyTransactionToItem(data.value, tx, reverse)
  const { error: upsertError } = await supabase.from(KV_TABLE).upsert({ key: `item:${itemId}`, value: updatedItem })
  if (upsertError) throw upsertError
}

async function listTransactions(supabase) {
  const { data, error } = await supabase.from(KV_TABLE).select('key, value').like('key', 'transaction:%')
  if (error) throw error

  return (data || [])
    .map((row) => row.value)
    .filter(Boolean)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

async function getTransactionById(supabase, id) {
  const { data, error } = await supabase.from(KV_TABLE).select('key, value').eq('key', `transaction:${id}`).maybeSingle()
  if (error) throw error
  return data?.value || null
}

async function upsertTransaction(supabase, payload) {
  const id = payload.id || crypto.randomUUID()
  const transaction = {
    ...payload,
    id,
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase.from(KV_TABLE).upsert({ key: `transaction:${id}`, value: transaction })
  if (error) throw error
  return transaction
}

async function deleteTransaction(supabase, id) {
  const { error } = await supabase.from(KV_TABLE).delete().eq('key', `transaction:${id}`)
  if (error) throw error
}

export default async function handler(req, res) {
  withCors(res)

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const supabase = createSupabaseClient()
    const id = getResourceId(req)
    const body = parseBody(req)

    if (req.method === 'GET') {
      if (id) {
        const transaction = await getTransactionById(supabase, id)
        if (!transaction) {
          res.status(404).json({ error: 'Transaction not found' })
          return
        }
        res.status(200).json(transaction)
        return
      }

      const transactions = await listTransactions(supabase)
      res.status(200).json(transactions)
      return
    }

    if (req.method === 'POST') {
      const created = await upsertTransaction(supabase, body)
      await updateItemStockForTransaction(supabase, created)
      res.status(201).json(created)
      return
    }

    if (req.method === 'PUT') {
      if (!id) {
        res.status(400).json({ error: 'Transaction id is required' })
        return
      }
      const existing = await getTransactionById(supabase, id)
      if (existing) {
        await updateItemStockForTransaction(supabase, existing, true)
      }
      const updated = await upsertTransaction(supabase, { ...body, id })
      await updateItemStockForTransaction(supabase, updated)
      res.status(200).json(updated)
      return
    }

    if (req.method === 'DELETE') {
      if (!id) {
        res.status(400).json({ error: 'Transaction id is required' })
        return
      }
      const existing = await getTransactionById(supabase, id)
      if (existing) {
        await updateItemStockForTransaction(supabase, existing, true)
      }
      await deleteTransaction(supabase, id)
      res.status(200).json({ ok: true, id })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to process transaction request' })
  }
}
