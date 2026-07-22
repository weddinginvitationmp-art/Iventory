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

// Sample data removed. The app now relies on live Supabase-backed data.
export function getMonthlyChartData() {
  return []
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
