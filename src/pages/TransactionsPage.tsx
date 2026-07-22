import { useState, useMemo } from 'react'
import {
  Plus, Search, TrendingUp, TrendingDown, ArrowLeftRight,
  RotateCcw, SlidersHorizontal, Calendar, Clock, User,
  FileText, X, ChevronDown, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { type Item, type Transaction, type TransactionType, type StockTarget } from '../lib/mockData'
import { useItems, useTransactions } from '../hooks/useData'
import { formatDate, cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Modal } from '../components/ui/modal'

const TX_CFG: Record<TransactionType, {
  label: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  badgeVariant: 'success' | 'danger' | 'warning' | 'default' | 'secondary'
}> = {
  receive: { label: 'Nhập kho', icon: TrendingUp, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50 border-emerald-100', badgeVariant: 'success' },
  ship: { label: 'Xuất kho', icon: TrendingDown, iconColor: 'text-red-500', iconBg: 'bg-red-50 border-red-100', badgeVariant: 'danger' },
  adjust: { label: 'Điều chỉnh', icon: SlidersHorizontal, iconColor: 'text-amber-600', iconBg: 'bg-amber-50 border-amber-100', badgeVariant: 'warning' },
  transfer: { label: 'Chuyển kho', icon: ArrowLeftRight, iconColor: 'text-blue-500', iconBg: 'bg-blue-50 border-blue-100', badgeVariant: 'default' },
  return: { label: 'Hoàn trả', icon: RotateCcw, iconColor: 'text-violet-500', iconBg: 'bg-violet-50 border-violet-100', badgeVariant: 'secondary' },
}

const TARGET_LABELS: Record<StockTarget, string> = {
  real: 'Kho thực',
  invoice: 'Sổ sách',
  both: 'Cả hai',
}

const DATE_PRESETS = [
  { label: 'Hôm nay', days: 0 },
  { label: '7 ngày qua', days: 7 },
  { label: '30 ngày qua', days: 30 },
  { label: '90 ngày qua', days: 90 },
]

const EMPTY_FORM = {
  type: 'receive' as TransactionType,
  itemId: '',
  quantity: 1,
  stockTarget: 'both' as StockTarget,
  note: '',
}

function groupByDate(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {}
  transactions.forEach(tx => {
    const d = new Date(tx.createdAt)
    const key = d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(tx)
  })
  return Object.entries(groups)
}

export default function TransactionsPage() {
  const { items } = useItems()
  const { transactions, loading, addTransaction } = useTransactions()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | TransactionType>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const applyPreset = (days: number) => {
    if (days === 0) {
      const today = new Date().toISOString().split('T')[0]
      setDateFrom(today)
      setDateTo(today)
    } else {
      const to = new Date()
      const from = new Date()
      from.setDate(from.getDate() - days)
      setDateFrom(from.toISOString().split('T')[0])
      setDateTo(to.toISOString().split('T')[0])
    }
    setShowDatePicker(false)
  }

  const clearDateFilter = () => { setDateFrom(''); setDateTo('') }

  const hasDateFilter = dateFrom || dateTo

  const filtered = useMemo(() => {
    let r = transactions
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(t =>
        t.itemName.toLowerCase().includes(q) ||
        t.note.toLowerCase().includes(q) ||
        t.createdBy.toLowerCase().includes(q)
      )
    }
    if (typeFilter) r = r.filter(t => t.type === typeFilter)
    if (dateFrom) r = r.filter(t => t.createdAt >= dateFrom)
    if (dateTo) r = r.filter(t => t.createdAt.split('T')[0] <= dateTo)
    return [...r].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [transactions, search, typeFilter, dateFrom, dateTo])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  const stats = useMemo(() => {
    const receive = filtered.filter(t => t.type === 'receive').reduce((a, t) => a + Math.abs(t.quantity), 0)
    const ship = filtered.filter(t => t.type === 'ship').reduce((a, t) => a + Math.abs(t.quantity), 0)
    return { receive, ship, net: receive - ship, total: filtered.length }
  }, [filtered])

  const counts = useMemo(() => {
    const c = {} as Record<TransactionType, number>
    Object.keys(TX_CFG).forEach(k => { c[k as TransactionType] = 0 })
    transactions.forEach(t => { c[t.type]++ })
    return c
  }, [transactions])

  const handleCreate = async () => {
    if (!form.itemId || !form.note.trim()) return
    const item = items.find(i => i.id === form.itemId)
    if (!item) return
    const qty = (form.type === 'ship' || form.type === 'adjust')
      ? -Math.abs(form.quantity)
      : Math.abs(form.quantity)
    try {
      await addTransaction({
        type: form.type,
        itemId: form.itemId,
        itemName: item.name,
        quantity: qty,
        stockTarget: form.stockTarget,
        note: form.note,
        createdBy: 'Admin',
      })
      setModalOpen(false)
      setForm(EMPTY_FORM)
      toast.success(`Đã ghi: ${TX_CFG[form.type].label} — ${item.name}`)
    } catch {
      toast.error('Lỗi khi lưu giao dịch')
    }
  }

  return (
    <div className="p-6 space-y-5 max-w-screen-xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Giao dịch</h1>
          <p className="text-slate-500 text-sm mt-0.5">{transactions.length} giao dịch được ghi nhận</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Ghi giao dịch
        </Button>
      </div>

      {/* Stats — reflect current filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Hiển thị', value: stats.total, icon: FileText, color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'Tổng nhập', value: `+${stats.receive}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Tổng xuất', value: `−${stats.ship}`, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Chênh lệch', value: stats.net >= 0 ? `+${stats.net}` : String(stats.net), icon: ArrowLeftRight, color: stats.net >= 0 ? 'text-blue-600' : 'text-red-500', bg: 'bg-blue-50' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-[#e4e7ef] p-4 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', s.bg)}>
                <Icon size={16} className={s.color} />
              </div>
              <div>
                <p className={cn('font-bold text-lg num', s.color)}>{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tìm mặt hàng, ghi chú, người tạo..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Date range picker */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(v => !v)}
            className={cn(
              'flex items-center gap-2 h-9 px-3 rounded-lg border text-sm transition-all',
              hasDateFilter
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-[#e4e7ef] bg-white text-slate-600 hover:border-slate-300'
            )}
          >
            <Calendar size={14} />
            <span>
              {hasDateFilter
                ? `${dateFrom || '...'} → ${dateTo || '...'}`
                : 'Khoảng ngày'}
            </span>
            {hasDateFilter
              ? <button onClick={e => { e.stopPropagation(); clearDateFilter() }} className="text-blue-400 hover:text-blue-600"><X size={12} /></button>
              : <ChevronDown size={12} className="text-slate-400" />
            }
          </button>

          {showDatePicker && (
            <div className="absolute top-full mt-1.5 left-0 z-30 bg-white border border-[#e4e7ef] rounded-2xl shadow-xl p-4 w-80 animate-fade-in">
              {/* Presets */}
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Chọn nhanh</p>
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {DATE_PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p.days)}
                    className="text-xs py-1.5 px-3 rounded-lg border border-[#e4e7ef] text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors text-center"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {/* Custom range */}
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tùy chỉnh</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Từ ngày</label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Đến ngày</label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="ghost" size="sm" onClick={clearDateFilter}>Xóa</Button>
                <Button size="sm" onClick={() => setShowDatePicker(false)}>Áp dụng</Button>
              </div>
            </div>
          )}
        </div>

        {(search || typeFilter || hasDateFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setTypeFilter(''); clearDateFilter() }}>
            <X size={13} /> Xóa lọc
          </Button>
        )}
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter('')}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
            !typeFilter ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-[#e4e7ef] text-slate-600 hover:border-slate-300'
          )}
        >
          Tất cả
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-bold',
            !typeFilter ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
          )}>{transactions.length}</span>
        </button>
        {(Object.keys(TX_CFG) as TransactionType[]).map(type => {
          const { label, icon: Icon } = TX_CFG[type]
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
                typeFilter === type ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-[#e4e7ef] text-slate-600 hover:border-slate-300'
              )}
            >
              <Icon size={12} />
              {label}
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                typeFilter === type ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              )}>{counts[type]}</span>
            </button>
          )
        })}
      </div>

      {/* Active filter summary */}
      {hasDateFilter && (
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
          <Calendar size={12} />
          <span>Lọc: {dateFrom || '∞'} → {dateTo || '∞'} · {filtered.length} kết quả</span>
        </div>
      )}

      {/* Timeline grouped by date */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-[#e4e7ef]">
          <Loader2 size={24} className="animate-spin text-blue-400" />
          <span className="ml-3 text-slate-500 text-sm">Đang tải giao dịch...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#e4e7ef]">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowLeftRight size={24} className="text-slate-300" />
          </div>
          <p className="font-semibold text-slate-700">Không có giao dịch</p>
          <p className="text-sm text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc ghi giao dịch mới</p>
          <Button size="sm" className="mt-4" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Ghi giao dịch
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, txs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 capitalize">
                  <Calendar size={12} />
                  {date}
                </div>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{txs.length} giao dịch</span>
              </div>
              <div className="space-y-2">
                {txs.map(tx => {
                  const cfg = TX_CFG[tx.type]
                  const Icon = cfg.icon
                  const isPositive = tx.quantity > 0
                  return (
                    <div key={tx.id} className="flex gap-4 bg-white rounded-2xl border border-[#e4e7ef] p-4 hover:shadow-sm transition-all">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border', cfg.iconBg)}>
                        <Icon size={17} className={cfg.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                              <span className="font-semibold text-slate-900 text-[13px]">{tx.itemName}</span>
                              <Badge variant={cfg.badgeVariant} className="text-[10px]">{cfg.label}</Badge>
                              <Badge variant="outline" className="text-[10px]">{TARGET_LABELS[tx.stockTarget]}</Badge>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{tx.note}</p>
                          </div>
                          <span className={cn('font-mono font-bold text-xl flex-shrink-0', isPositive ? 'text-emerald-600' : 'text-red-500')}>
                            {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(tx.createdAt)}</span>
                          <span className="flex items-center gap-1"><User size={10} /> {tx.createdBy}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Ghi giao dịch mới"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={!form.itemId || !form.note.trim()}>
              Xác nhận
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loại giao dịch</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TX_CFG) as TransactionType[]).map(type => {
                const { label, icon: Icon, iconColor } = TX_CFG[type]
                return (
                  <button
                    key={type}
                    onClick={() => setForm(p => ({ ...p, type }))}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all',
                      form.type === type
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-[#e4e7ef] text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <Icon size={16} className={form.type === type ? 'text-white' : iconColor} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mặt hàng *</label>
            <Select value={form.itemId} onChange={e => setForm(p => ({ ...p, itemId: e.target.value }))}>
              <option value="">-- Chọn mặt hàng --</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.name} · Tồn: {item.realStock} {item.unit}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Số lượng</label>
              <Input type="number" min="1" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: +e.target.value }))} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ảnh hưởng</label>
              <Select value={form.stockTarget} onChange={e => setForm(p => ({ ...p, stockTarget: e.target.value as StockTarget }))}>
                <option value="both">Cả hai</option>
                <option value="real">Kho thực</option>
                <option value="invoice">Sổ sách</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ghi chú *</label>
            <textarea
              placeholder="Lý do giao dịch, số đơn hàng, tên khách hàng..."
              rows={3}
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              className="w-full rounded-xl border border-[#e4e7ef] px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
