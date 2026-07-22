import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

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

function createSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(supabaseUrl, serviceRoleKey)
}

export default async function handler(req, res) {
  withCors(res)

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const body = parseBody(req)
    const supabase = createSupabaseClient()

    if (req.method === 'POST' && req.url?.includes('/auth/signup')) {
      const email = body.email
      const password = body.password
      const name = body.name || body.fullName || ''

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' })
        return
      }

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      })

      if (error) throw error

      res.status(201).json({
        ok: true,
        user: data.user,
        session: data.session || null,
      })
      return
    }

    if (req.method === 'POST' && req.url?.includes('/auth/login')) {
      const email = body.email
      const password = body.password
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' })
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      res.status(200).json({
        ok: true,
        session: data.session,
        user: data.user,
      })
      return
    }

    res.status(404).json({ error: 'Auth route not found' })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Auth request failed' })
  }
}
