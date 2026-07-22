export type Category = 'Điện tử' | 'Văn phòng phẩm' | 'Thực phẩm' | 'Dụng cụ' | 'Quần áo'

export interface Item {
  id: string
  name: string
  sku: string
  category: Category
  supplier: string
  realStock: number
  invoiceStock: number
  reorderPoint: number
  unit: string
  costPrice: number
  sellPrice: number
  image?: string
  createdAt: string
}

export type TransactionType = 'receive' | 'ship' | 'adjust' | 'transfer' | 'return'
export type StockTarget = 'real' | 'invoice' | 'both'

export interface Transaction {
  id: string
  type: TransactionType
  itemId: string
  itemName: string
  quantity: number
  stockTarget: StockTarget
  note: string
  createdAt: string
  createdBy: string
}

export const MOCK_ITEMS: Item[] = [
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
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=200&h=200&fit=crop&auto=format',
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: '2',
    name: 'Bàn phím cơ Keychron K2',
    sku: 'KEY-K2-BLK',
    category: 'Điện tử',
    supplier: 'Keychron Official',
    realStock: 3,
    invoiceStock: 5,
    reorderPoint: 10,
    unit: 'Cái',
    costPrice: 1800000,
    sellPrice: 2200000,
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=200&h=200&fit=crop&auto=format',
    createdAt: '2024-01-20T09:30:00Z',
  },
  {
    id: '3',
    name: 'Giấy A4 Double A 70gsm',
    sku: 'PAPER-A4-70G',
    category: 'Văn phòng phẩm',
    supplier: 'Double A Thailand',
    realStock: 150,
    invoiceStock: 200,
    reorderPoint: 50,
    unit: 'Ream',
    costPrice: 85000,
    sellPrice: 100000,
    createdAt: '2024-02-01T10:00:00Z',
  },
  {
    id: '4',
    name: 'Chuột không dây Logitech MX Master 3',
    sku: 'LOGI-MX3-GRY',
    category: 'Điện tử',
    supplier: 'Logitech Vietnam',
    realStock: 8,
    invoiceStock: 8,
    reorderPoint: 5,
    unit: 'Cái',
    costPrice: 1500000,
    sellPrice: 1900000,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop&auto=format',
    createdAt: '2024-02-05T11:00:00Z',
  },
  {
    id: '5',
    name: 'Mì ăn liền Hảo Hảo (thùng 30 gói)',
    sku: 'FOOD-HH-30',
    category: 'Thực phẩm',
    supplier: 'Acecook Vietnam',
    realStock: 45,
    invoiceStock: 50,
    reorderPoint: 20,
    unit: 'Thùng',
    costPrice: 95000,
    sellPrice: 110000,
    createdAt: '2024-02-10T14:00:00Z',
  },
  {
    id: '6',
    name: 'Tua vít đa năng Stanley',
    sku: 'TOOL-STAN-DS',
    category: 'Dụng cụ',
    supplier: 'Stanley Tools',
    realStock: 2,
    invoiceStock: 2,
    reorderPoint: 5,
    unit: 'Bộ',
    costPrice: 250000,
    sellPrice: 320000,
    createdAt: '2024-02-15T09:00:00Z',
  },
  {
    id: '7',
    name: 'Áo thun polo nam cổ bẻ',
    sku: 'CLOTH-POLO-M',
    category: 'Quần áo',
    supplier: 'FashionViet Co.',
    realStock: 35,
    invoiceStock: 40,
    reorderPoint: 15,
    unit: 'Cái',
    costPrice: 120000,
    sellPrice: 180000,
    createdAt: '2024-02-20T13:00:00Z',
  },
  {
    id: '8',
    name: 'Monitor LG 27" 4K',
    sku: 'LG-27UK850-B',
    category: 'Điện tử',
    supplier: 'LG Electronics',
    realStock: 6,
    invoiceStock: 7,
    reorderPoint: 3,
    unit: 'Cái',
    costPrice: 12000000,
    sellPrice: 14500000,
    image: 'https://images.unsplash.com/photo-1547119957-637f8679db1e?w=200&h=200&fit=crop&auto=format',
    createdAt: '2024-03-01T08:00:00Z',
  },
]

export const MOCK_TRANSACTIONS: Transaction[] = [
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
  {
    id: 't2',
    type: 'ship',
    itemId: '3',
    itemName: 'Giấy A4 Double A 70gsm',
    quantity: -20,
    stockTarget: 'both',
    note: 'Xuất cho phòng Marketing',
    createdAt: '2024-03-15T10:30:00Z',
    createdBy: 'Trần Thị B',
  },
  {
    id: 't3',
    type: 'adjust',
    itemId: '2',
    itemName: 'Bàn phím cơ Keychron K2',
    quantity: -2,
    stockTarget: 'real',
    note: 'Điều chỉnh kiểm kê tháng 3 — hao hụt',
    createdAt: '2024-03-16T08:00:00Z',
    createdBy: 'Lê Văn C',
  },
  {
    id: 't4',
    type: 'receive',
    itemId: '5',
    itemName: 'Mì ăn liền Hảo Hảo',
    quantity: 30,
    stockTarget: 'both',
    note: 'Nhập kho từ NCC Acecook — lô tháng 3',
    createdAt: '2024-03-16T14:00:00Z',
    createdBy: 'Phạm Thị D',
  },
  {
    id: 't5',
    type: 'ship',
    itemId: '7',
    itemName: 'Áo thun polo nam cổ bẻ',
    quantity: -10,
    stockTarget: 'invoice',
    note: 'Xuất hóa đơn cho khách hàng KH-0042',
    createdAt: '2024-03-17T11:00:00Z',
    createdBy: 'Nguyễn Văn A',
  },
  {
    id: 't6',
    type: 'return',
    itemId: '4',
    itemName: 'Chuột không dây Logitech MX Master 3',
    quantity: 1,
    stockTarget: 'both',
    note: 'Khách trả hàng — lỗi cuộn',
    createdAt: '2024-03-17T15:30:00Z',
    createdBy: 'Trần Thị B',
  },
  {
    id: 't7',
    type: 'transfer',
    itemId: '8',
    itemName: 'Monitor LG 27" 4K',
    quantity: 2,
    stockTarget: 'real',
    note: 'Chuyển từ kho A → kho B',
    createdAt: '2024-03-18T09:00:00Z',
    createdBy: 'Lê Văn C',
  },
]

// Chart data helpers
export function getMonthlyChartData() {
  return [
    { month: 'T10', receive: 42, ship: 28 },
    { month: 'T11', receive: 35, ship: 40 },
    { month: 'T12', receive: 58, ship: 35 },
    { month: 'T1', receive: 30, ship: 22 },
    { month: 'T2', receive: 47, ship: 38 },
    { month: 'T3', receive: 52, ship: 45 },
  ]
}

export function getStockStatusData(items: Item[]) {
  const good = items.filter(i => i.realStock > i.reorderPoint).length
  const low = items.filter(i => i.realStock > 0 && i.realStock <= i.reorderPoint).length
  const outOfStock = items.filter(i => i.realStock === 0).length
  return [
    { name: 'Đủ hàng', value: good, color: '#10b981' },
    { name: 'Sắp hết', value: low, color: '#f59e0b' },
    { name: 'Hết hàng', value: outOfStock, color: '#ef4444' },
  ]
}

export function getCategoryData(items: Item[]) {
  const map: Record<string, number> = {}
  items.forEach(item => {
    map[item.category] = (map[item.category] || 0) + item.realStock
  })
  return Object.entries(map).map(([name, value]) => ({ name, value }))
}
