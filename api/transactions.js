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
  ])
}
