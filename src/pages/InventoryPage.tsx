import { useState, useMemo } from 'react'
import {
  Plus, Search, Pencil, Trash2, Package, AlertTriangle, X,
  ImageOff, LayoutGrid, List, DollarSign, ArrowUpDown, CheckSquare,
  Square, Download, Filter, ChevronDown, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { type Item, type Category } from '../lib/mockData'
import { formatCurrency, formatNumber, cn } from '../lib/utils'
import { useItems } from '../hooks/useData'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Modal } from '../components/ui/modal'

const CATEGORIES: Category[] = ['Điện tử', 'Văn phòng phẩm', 'Thực phẩm', 'Dụng cụ', 'Quần áo']

type ViewMode = 'grid' | 'table'
type StockStatus = 'good' | 'low' | 'out'

function stockStatus(item: Item): StockStatus {
  if (item.realStock === 0) return 'out'
  if (item.realStock <= item.reorderPoint) return 'low'
  return 'good'
}

const STATUS = {
  good: { label: 'Đủ hàng', variant: 'success' as const, dot: 'bg-emerald-500' },
  low: { label: 'Sắp hết', variant: 'warning' as const, dot: 'bg-amber-500' },
  out: { label: 'Hết hàng', variant: 'danger' as const, dot: 'bg-red-500' },
}

function ImageFallback({ src, alt, size = 'lg' }: { src?: string; alt: string; size?: 'sm' | 'lg' }) {
  const [err, setErr] = useState(false)
  const cls = size === 'sm' ? 'w-10 h-10' : 'w-full h-full'
  if (!src || err) {
    return (
      <div className={cn(cls, 'flex items-center justify-center bg-slate-100 rounded-xl')}>
        <Package size={size === 'sm' ? 14 : 22} className="text-slate-300" />
      </div>
    )
  }
  return <img src={src} alt={alt} onError={() => setErr(true)} className={cn(cls, 'object-cover rounded-xl')} />
}

const EMPTY_FORM: Omit<Item, 'id' | 'createdAt'> = {
  name: '', sku: '', category: 'Điện tử', supplier: '',
  realStock: 0, invoiceStock: 0, reorderPoint: 5,
  unit: 'Cái', costPrice: 0, sellPrice: 0, image: '',
}

export default function InventoryPage() {
  const { items, loading, addItem, editItem: updateItem, removeItem, removeItems } = useItems()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | StockStatus>('')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Item | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = useMemo(() => {
    let r = items
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.supplier.toLowerCase().includes(q))
    }
    if (categoryFilter) r = r.filter(i => i.category === categoryFilter)
    if (statusFilter) r = r.filter(i => stockStatus(i) === statusFilter)
    return [...r].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'stock-asc') return a.realStock - b.realStock
      if (sortBy === 'stock-desc') return b.realStock - a.realStock
      if (sortBy === 'value') return (b.realStock * b.costPrice) - (a.realStock * a.costPrice)
      if (sortBy === 'price') return b.sellPrice - a.sellPrice
      return 0
    })
  }, [items, search, categoryFilter, statusFilter, sortBy])

  const totalValue = items.reduce((a, b) => a + b.realStock * b.costPrice, 0)

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (item: Item) => {
    setEditItem(item)
    setForm({ name: item.name, sku: item.sku, category: item.category, supplier: item.supplier, realStock: item.realStock, invoiceStock: item.invoiceStock, reorderPoint: item.reorderPoint, unit: item.unit, costPrice: item.costPrice, sellPrice: item.sellPrice, image: item.image || '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.sku) return
    try {
      if (editItem) {
        await updateItem(editItem.id, form)
        toast.success('Đã cập nhật mặt hàng')
      } else {
        await addItem(form)
        toast.success('Đã thêm mặt hàng mới')
      }
      setModalOpen(false)
    } catch {
      toast.error('Lỗi khi lưu dữ liệu')
    }
  }

  const handleDelete = async (item: Item) => {
    try {
      await removeItem(item.id)
      setDeleteConfirm(null)
      toast.success(`Đã xóa "${item.name}"`)
    } catch {
      toast.error('Lỗi khi xóa')
    }
  }

  const handleBulkDelete = async () => {
    try {
      await removeItems(Array.from(selected))
      toast.success(`Đã xóa ${selected.size} mặt hàng`)
      setSelected(new Set())
      setBulkDeleteOpen(false)
    } catch {
      toast.error('Lỗi khi xóa hàng loạt')
    }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  const selectAll = () => setSelected(new Set(filtered.map(i => i.id)))
  const clearSelect = () => setSelected(new Set())

  const exportCSV = () => {
    const rows = [
      ['Tên', 'SKU', 'Danh mục', 'NCC', 'Tồn thực', 'Tồn sổ', 'Ngưỡng', 'Đơn vị', 'Giá nhập', 'Giá bán'],
      ...items.map(i => [i.name, i.sku, i.category, i.supplier, i.realStock, i.invoiceStock, i.reorderPoint, i.unit, i.costPrice, i.sellPrice]),
    ]
    const csv = rows.map(r => r.map(String).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURIComponent(csv)
    a.download = 'inventory.csv'
    a.click()
    toast.success('Đã xuất file CSV')
  }

  const setField = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const statusCounts = useMemo(() => {
    const c = { good: 0, low: 0, out: 0 }
    items.forEach(i => { c[stockStatus(i)]++ })
    return c
  }, [items])

  return (
    <div className="p-6 space-y-5 max-w-screen-xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kho hàng</h1>
          <p className="text-slate-500 text-sm mt-0.5">{items.length} mặt hàng · Giá trị: <span className="font-semibold text-blue-600">{formatCurrency(totalValue)}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download size={14} /> Xuất CSV
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus size={15} /> Thêm mặt hàng
          </Button>
        </div>
      </div>

      {/* Stats pills */}
      <div className="flex flex-wrap gap-2">
        {(['good', 'low', 'out'] as StockStatus[]).map(s => {
          const cfg = STATUS[s]
          const count = statusCounts[s]
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all',
                statusFilter === s
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                  : 'bg-white border-[#e4e7ef] text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
              {cfg.label}
              <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-bold',
                statusFilter === s ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              )}>{count}</span>
            </button>
          )
        })}
        <span className="ml-auto self-center text-sm text-slate-400">{filtered.length} kết quả</span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tên, SKU, nhà cung cấp..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select className="w-40" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">Tất cả danh mục</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </Select>
        <Select className="w-44" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name">Tên A → Z</option>
          <option value="stock-desc">Tồn kho: Cao → Thấp</option>
          <option value="stock-asc">Tồn kho: Thấp → Cao</option>
          <option value="value">Giá trị: Cao → Thấp</option>
          <option value="price">Giá bán: Cao → Thấp</option>
        </Select>
        {(search || categoryFilter || statusFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCategoryFilter(''); setStatusFilter('') }}>
            <X size={13} /> Xóa lọc
          </Button>
        )}
        {/* View toggle */}
        <div className="ml-auto flex rounded-xl border border-[#e4e7ef] bg-white p-0.5 gap-0.5">
          <button onClick={() => setViewMode('grid')} className={cn('p-1.5 rounded-lg transition-all', viewMode === 'grid' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700')}>
            <LayoutGrid size={15} />
          </button>
          <button onClick={() => setViewMode('table')} className={cn('p-1.5 rounded-lg transition-all', viewMode === 'table' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700')}>
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl animate-fade-in">
          <span className="text-sm font-medium text-blue-700">{selected.size} mặt hàng được chọn</span>
          <button onClick={clearSelect} className="text-xs text-blue-500 hover:text-blue-700">Bỏ chọn</button>
          <button onClick={selectAll} className="text-xs text-blue-500 hover:text-blue-700">Chọn tất cả</button>
          <div className="ml-auto flex gap-2">
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 size={13} /> Xóa {selected.size} mục
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-[#e4e7ef]">
          <Loader2 size={24} className="animate-spin text-blue-400" />
          <span className="ml-3 text-slate-500 text-sm">Đang tải dữ liệu...</span>
        </div>
      )}

      {/* Content */}
      {!loading && filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#e4e7ef]">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-slate-300" />
          </div>
          <p className="font-semibold text-slate-700">Không tìm thấy mặt hàng</p>
          <p className="text-sm text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc thêm mặt hàng mới</p>
          <Button size="sm" className="mt-4" onClick={openAdd}><Plus size={14} /> Thêm ngay</Button>
        </div>
      ) : !loading && viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => {
            const status = stockStatus(item)
            const { label, variant, dot } = STATUS[status]
            const isSelected = selected.has(item.id)
            const itemValue = item.realStock * item.costPrice
            return (
              <div
                key={item.id}
                className={cn(
                  'bg-white rounded-2xl border transition-all duration-200 group overflow-hidden',
                  'hover:-translate-y-0.5 hover:shadow-md',
                  isSelected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-[#e4e7ef] hover:border-slate-300'
                )}
              >
                {/* Image */}
                <div className="relative h-36 bg-[#f7f8fc] overflow-hidden">
                  <ImageFallback src={item.image} alt={item.name} />
                  {/* Select checkbox */}
                  <button
                    onClick={() => toggleSelect(item.id)}
                    className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {isSelected
                      ? <CheckSquare size={18} className="text-blue-500" fill="#3b82f6" />
                      : <Square size={18} className="text-white drop-shadow" />}
                  </button>
                  {/* Status dot */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className={cn('w-2 h-2 rounded-full block shadow-sm', dot)} />
                  </div>
                  {/* Low stock bar */}
                  {status !== 'good' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1">
                      <div
                        className={cn('h-full', status === 'out' ? 'bg-red-500' : 'bg-amber-500')}
                        style={{ width: status === 'out' ? '100%' : `${Math.max(10, (item.realStock / item.reorderPoint) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-slate-900 text-[13px] leading-snug line-clamp-2">{item.name}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">{item.sku}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#f7f8fc] rounded-lg p-2">
                      <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Thực tế</p>
                      <p className="font-bold text-slate-900 num mt-0.5">{formatNumber(item.realStock)} <span className="text-slate-400 font-normal text-[10px]">{item.unit}</span></p>
                    </div>
                    <div className="bg-[#f7f8fc] rounded-lg p-2">
                      <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Giá trị</p>
                      <p className="font-bold text-blue-600 num mt-0.5 text-[11px]">{formatCurrency(itemValue)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                    <Badge variant={variant} className="text-[10px]">{label}</Badge>
                  </div>

                  <div className="flex gap-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => openEdit(item)}>
                      <Pencil size={11} /> Sửa
                    </Button>
                    <Button variant="outline" size="icon-sm" className="h-7 w-7" onClick={() => setDeleteConfirm(item)}>
                      <Trash2 size={11} className="text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Table view */
        <div className="bg-white rounded-2xl border border-[#e4e7ef] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-3 w-8">
                    <button onClick={() => selected.size === filtered.length ? clearSelect() : selectAll()}>
                      {selected.size === filtered.length && filtered.length > 0
                        ? <CheckSquare size={15} className="text-blue-500" />
                        : <Square size={15} className="text-slate-400" />}
                    </button>
                  </th>
                  {['Mặt hàng', 'Danh mục', 'Tồn thực', 'Tồn sổ', 'Giá bán', 'Giá trị', 'Trạng thái', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const status = stockStatus(item)
                  const { label, variant } = STATUS[status]
                  const isSelected = selected.has(item.id)
                  return (
                    <tr
                      key={item.id}
                      className={cn('border-b border-slate-50 transition-colors', isSelected ? 'bg-blue-50/40' : 'hover:bg-[#f7f8fc]')}
                    >
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(item.id)}>
                          {isSelected
                            ? <CheckSquare size={15} className="text-blue-500" />
                            : <Square size={15} className="text-slate-300" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                            <ImageFallback src={item.image} alt={item.name} size="sm" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-[13px] whitespace-nowrap">{item.name}</p>
                            <p className="text-[11px] font-mono text-slate-400">{item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="secondary">{item.category}</Badge></td>
                      <td className="px-4 py-3 num font-semibold text-[13px] text-slate-900">{formatNumber(item.realStock)} <span className="text-slate-400 font-normal text-xs">{item.unit}</span></td>
                      <td className="px-4 py-3 num text-[13px] text-slate-500">{formatNumber(item.invoiceStock)}</td>
                      <td className="px-4 py-3 num text-[13px] text-slate-700">{formatCurrency(item.sellPrice)}</td>
                      <td className="px-4 py-3 num text-[12px] font-semibold text-blue-600">{formatCurrency(item.realStock * item.costPrice)}</td>
                      <td className="px-4 py-3"><Badge variant={variant}>{label}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(item)}><Pencil size={13} className="text-slate-400" /></Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteConfirm(item)}><Trash2 size={13} className="text-red-400" /></Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? `Sửa: ${editItem.name}` : 'Thêm mặt hàng mới'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.sku}>
              {editItem ? 'Lưu thay đổi' : 'Thêm mặt hàng'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên mặt hàng *</label>
            <Input placeholder="VD: Laptop Dell XPS 15" value={form.name} onChange={e => setField('name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU *</label>
            <Input placeholder="DELL-XPS15-001" value={form.sku} onChange={e => setField('sku', e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đơn vị</label>
            <Input placeholder="Cái, Hộp, Thùng..." value={form.unit} onChange={e => setField('unit', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Danh mục</label>
            <Select value={form.category} onChange={e => setField('category', e.target.value as Category)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhà cung cấp</label>
            <Input placeholder="Tên NCC" value={form.supplier} onChange={e => setField('supplier', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tồn kho thực</label>
            <Input type="number" min="0" value={form.realStock} onChange={e => setField('realStock', +e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tồn kho sổ sách</label>
            <Input type="number" min="0" value={form.invoiceStock} onChange={e => setField('invoiceStock', +e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngưỡng đặt hàng</label>
            <Input type="number" min="0" value={form.reorderPoint} onChange={e => setField('reorderPoint', +e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Giá nhập (VND)</label>
            <Input type="number" min="0" value={form.costPrice} onChange={e => setField('costPrice', +e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Giá bán (VND)</label>
            <Input type="number" min="0" value={form.sellPrice} onChange={e => setField('sellPrice', +e.target.value)} className="font-mono" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">URL hình ảnh</label>
            <Input placeholder="https://images.unsplash.com/..." value={form.image} onChange={e => setField('image', e.target.value)} />
          </div>
          {form.image && (
            <div className="col-span-2">
              <p className="text-xs text-slate-400 mb-1.5">Xem trước:</p>
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100">
                <ImageFallback src={form.image} alt="preview" />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Xác nhận xóa" size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Hủy</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}><Trash2 size={14} /> Xóa</Button>
          </>
        }>
        <p className="text-slate-600 text-sm">Xóa <span className="font-semibold text-slate-900">"{deleteConfirm?.name}"</span>? Thao tác không thể hoàn tác.</p>
      </Modal>

      {/* Bulk delete confirm */}
      <Modal open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} title="Xóa hàng loạt" size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleBulkDelete}><Trash2 size={14} /> Xóa {selected.size} mục</Button>
          </>
        }>
        <p className="text-slate-600 text-sm">Xóa <span className="font-semibold text-slate-900">{selected.size} mặt hàng</span> đã chọn? Thao tác không thể hoàn tác.</p>
      </Modal>
    </div>
  )
}
