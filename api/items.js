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
  const index = segments.findIndex((segment) => segment === 'items')
  if (index >= 0 && segments[index + 1]) return segments[index + 1]
  return req.params?.id || req.query?.id || null
}

function createSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(supabaseUrl, serviceRoleKey)
}

async function listItems(supabase) {
  const { data, error } = await supabase.from(KV_TABLE).select('key, value').like('key', 'item:%')
  if (error) throw error

  return (data || [])
    .map((row) => row.value)
    .filter(Boolean)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

async function getItemById(supabase, id) {
  const { data, error } = await supabase.from(KV_TABLE).select('key, value').eq('key', `item:${id}`).maybeSingle()
  if (error) throw error
  return data?.value || null
}

async function upsertItem(supabase, payload) {
  const id = payload.id || crypto.randomUUID()
  const item = {
    ...payload,
    id,
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase.from(KV_TABLE).upsert({ key: `item:${id}`, value: item })
  if (error) throw error
  return item
}

async function deleteItem(supabase, id) {
  const { error } = await supabase.from(KV_TABLE).delete().eq('key', `item:${id}`)
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
        const item = await getItemById(supabase, id)
        if (!item) {
          res.status(404).json({ error: 'Item not found' })
          return
        }
        res.status(200).json(item)
        return
      }

      const items = await listItems(supabase)
      res.status(200).json(items)
      return
    }

    if (req.method === 'POST') {
      const created = await upsertItem(supabase, body)
      res.status(201).json(created)
      return
    }

    if (req.method === 'PUT') {
      if (!id) {
        res.status(400).json({ error: 'Item id is required' })
        return
      }
      const updated = await upsertItem(supabase, { ...body, id })
      res.status(200).json(updated)
      return
    }

    if (req.method === 'DELETE') {
      if (!id) {
        res.status(400).json({ error: 'Item id is required' })
        return
      }
      await deleteItem(supabase, id)
      res.status(200).json({ ok: true, id })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to process item request' })
  }
}
