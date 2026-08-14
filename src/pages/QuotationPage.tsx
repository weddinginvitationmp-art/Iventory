import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Building2, ClipboardList, FileText, Package2, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { fetchCategories, fetchItems, fetchUnits, fetchWarehouses } from '../lib/api'

type QuoteRow = {
  id: string
  itemId: string
  itemName: string
  category: string
  unit: string
  warehouse: string
  quantity: number
  price: number
}

export default function QuotationPage() {
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [quoteRows, setQuoteRows] = useState<QuoteRow[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [itemData, categoryData, unitData, warehouseData] = await Promise.all([
          fetchItems(),
          fetchCategories(),
          fetchUnits(),
          fetchWarehouses(),
        ])

        setItems(itemData)
        setCategories(categoryData)
        setUnits(unitData)
        setWarehouses(warehouseData)

        if (categoryData[0]) setSelectedCategory(categoryData[0].name)
        if (unitData[0]) setSelectedUnit(unitData[0].name)
        if (warehouseData[0]) setSelectedWarehouse(warehouseData[0].name)
      } catch (error: any) {
        toast.error(error.message || 'Không thể tải dữ liệu báo giá')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredItems = useMemo(() => {
    if (!selectedCategory) return items
    return items.filter(item => item.category === selectedCategory)
  }, [items, selectedCategory])

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedItemId('')
      return
    }

    if (!filteredItems.some(item => item.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0].id)
    }
  }, [filteredItems, selectedItemId])

  const selectedItem = useMemo(
    () => items.find(item => item.id === selectedItemId) || filteredItems[0] || null,
    [filteredItems, items, selectedItemId],
  )

  const totalAmount = useMemo(
    () => quoteRows.reduce((sum, row) => sum + row.price * row.quantity, 0),
    [quoteRows],
  )

  const addRow = () => {
    if (!selectedItem) {
      toast.error('Vui lòng chọn mặt hàng để thêm vào báo giá')
      return
    }

    if (quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0')
      return
    }

    const row: QuoteRow = {
      id: `${selectedItem.id}-${Date.now()}`,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      category: selectedItem.category || selectedCategory || 'Chưa phân loại',
      unit: selectedUnit || selectedItem.unit || 'Cái',
      warehouse: selectedWarehouse || warehouses[0]?.name || 'Kho chính',
      quantity,
      price: Number(selectedItem.sellPrice ?? selectedItem.costPrice ?? 0),
    }

    setQuoteRows(prev => [...prev, row])
    setQuantity(1)
    toast.success(`Đã thêm ${selectedItem.name} vào báo giá`)
  }

  const removeRow = (id: string) => {
    setQuoteRows(prev => prev.filter(row => row.id !== id))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Đang tải dữ liệu báo giá...
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-screen-xl mx-auto animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Báo giá</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Dữ liệu danh mục, đơn vị và kho lấy từ Supabase thật, không còn mock
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Tổng: <span className="font-bold">{totalAmount.toLocaleString('vi-VN')} ₫</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
              <ClipboardList size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Mặt hàng</p>
              <p className="text-xl font-bold text-slate-900">{items.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <Package2 size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Danh mục</p>
              <p className="text-xl font-bold text-slate-900">{categories.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Kho</p>
              <p className="text-xl font-bold text-slate-900">{warehouses.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-slate-800">
            <FileText size={17} className="text-blue-600" />
            <h2 className="text-lg font-semibold">Thêm sản phẩm vào báo giá</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Danh mục</label>
              <Select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mặt hàng</label>
              <Select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)}>
                {filteredItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Đơn vị</label>
              <Select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
                {units.map(unit => (
                  <option key={unit.id} value={unit.name}>{unit.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kho</label>
              <Select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.name}>{warehouse.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Số lượng</label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Đơn giá</label>
              <Input
                value={selectedItem ? Number(selectedItem.sellPrice ?? selectedItem.costPrice ?? 0).toLocaleString('vi-VN') : '0'}
                readOnly
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end">
            <Button onClick={addRow}>
              <Plus size={15} /> Thêm vào báo giá
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Tóm tắt</h2>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Danh mục đang chọn</span>
              <strong className="text-slate-900">{selectedCategory || '—'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Đơn vị</span>
              <strong className="text-slate-900">{selectedUnit || '—'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Kho</span>
              <strong className="text-slate-900">{selectedWarehouse || '—'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Mặt hàng</span>
              <strong className="text-slate-900">{selectedItem?.name || '—'}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Danh sách báo giá</h2>
        </div>

        {quoteRows.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Chưa có sản phẩm nào trong báo giá. Hãy thêm mặt hàng từ phía trên.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3">Mặt hàng</th>
                  <th className="px-4 py-3">Danh mục</th>
                  <th className="px-4 py-3">Kho</th>
                  <th className="px-4 py-3">SL</th>
                  <th className="px-4 py-3">Đơn vị</th>
                  <th className="px-4 py-3">Đơn giá</th>
                  <th className="px-4 py-3">Thành tiền</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {quoteRows.map(row => (
                  <tr key={row.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.itemName}</td>
                    <td className="px-4 py-3 text-slate-600">{row.category}</td>
                    <td className="px-4 py-3 text-slate-600">{row.warehouse}</td>
                    <td className="px-4 py-3 text-slate-600">{row.quantity}</td>
                    <td className="px-4 py-3 text-slate-600">{row.unit}</td>
                    <td className="px-4 py-3 text-slate-600">{row.price.toLocaleString('vi-VN')} ₫</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {(row.price * row.quantity).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon-sm" onClick={() => removeRow(row.id)}>
                        <Trash2 size={13} className="text-red-400" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
