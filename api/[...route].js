import itemsHandler from './items.js'
import transactionsHandler from './transactions.js'
import authHandler from './auth.js'

function withCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Token')
}

export default async function handler(req, res) {
  withCors(res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const pathname = req.url?.split('?')[0] || '/'
  const route = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)

  if (route[0] === 'health') {
    res.status(200).json({ status: 'ok' })
    return
  }

  if (route[0] === 'items') {
    req.params = { id: route[1] }
    return itemsHandler(req, res)
  }

  if (route[0] === 'transactions') {
    req.params = { id: route[1] }
    return transactionsHandler(req, res)
  }

  if (route[0] === 'auth') {
    return authHandler(req, res)
  }

  res.status(404).json({ error: 'Route not found' })
}
