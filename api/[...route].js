const sampleItems = [
  {
    id: '1',
    name: 'Laptop Dell XPS 15',
    sku: 'DELL-XPS15-001',
    category: 'Điện tử',
    supplier: 'Dell Vietnam',
    realStock: 12,
    invoiceStock: 15,
    reorderPoint: 5,
    unit: 'Cái',
    costPrice: 28000000,
    sellPrice: 32000000,
    createdAt: '2024-01-15T08:00:00Z',
  },
]

const sampleTransactions = [
  {
    id: 't1',
    type: 'receive',
    itemId: '1',
    itemName: 'Laptop Dell XPS 15',
    quantity: 5,
    stockTarget: 'both',
    note: 'Nhập hàng từ đơn PO-2024-001',
    createdAt: '2024-03-15T09:00:00Z',
    createdBy: 'Nguyễn Văn A',
  },
]

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
  const route = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).join('/')

  if (route === 'health') {
    res.status(200).json({ status: 'ok' })
    return
  }

  const upstreamUrl = process.env.BACKEND_API_URL
  if (upstreamUrl) {
    try {
      const targetUrl = `${upstreamUrl.replace(/\/$/, '')}/${route}`
      const upstreamResponse = await fetch(targetUrl, {
        method: req.method,
        headers: req.headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body ?? {}) : undefined,
      })

      const upstreamText = await upstreamResponse.text()
      res.status(upstreamResponse.status)
      res.setHeader('content-type', upstreamResponse.headers.get('content-type') || 'application/json')
      res.end(upstreamText)
      return
    } catch {
      // fall back to local stub data below
    }
  }

  if (route === 'items') {
    res.status(200).json(sampleItems)
    return
  }

  if (route === 'transactions') {
    res.status(200).json(sampleTransactions)
    return
  }

  res.status(404).json({ error: 'Route not found' })
}
