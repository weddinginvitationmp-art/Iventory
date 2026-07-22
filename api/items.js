export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Token')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  res.status(200).json([
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
  ])
}
