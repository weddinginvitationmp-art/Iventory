import { useNavigate } from 'react-router'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Package, AlertTriangle, ShoppingCart, TrendingUp, TrendingDown,
  ArrowRight, DollarSign, Activity, ArrowUpRight, RefreshCw,
  ChevronRight, BarChart2, Clock,
} from 'lucide-react'
import { useItems, useTransactions } from '../hooks/useData'
import { formatNumber, formatCurrency, formatCurrencyCompact, formatDate } from '../lib/utils'
import { Badge } from '../components/ui/badge'

function getMonthlyChartData(transactions: Array<{ createdAt: string; type: string; quantity: number }>) {
  const now = new Date()
  const labels = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    return { label: `T${date.getMonth() + 1}`, month: date.getMonth(), year: date.getFullYear(), receive: 0, ship: 0 }
  })

  return transactions.reduce((acc, tx) => {
    const date = new Date(tx.createdAt)
    const entry = acc.find(item => item.month === date.getMonth() && item.year === date.getFullYear())
    if (!entry) return acc
    if (tx.type === 'receive') entry.receive += Math.abs(tx.quantity)
    if (tx.type === 'ship') entry.ship += Math.abs(tx.quantity)
    return acc
  }, labels)
}

function getStockStatusData(items: Array<{ realStock: number; reorderPoint: number }>) {
  const good = items.filter(i => i.realStock > i.reorderPoint).length
  const low = items.filter(i => i.realStock > 0 && i.realStock <= i.reorderPoint).length
  const outOfStock = items.filter(i => i.realStock === 0).length
  return [
    { name: 'Đủ hàng', value: good, color: '#10b981' },
    { name: 'Sắp hết', value: low, color: '#f59e0b' },
    { name: 'Hết hàng', value: outOfStock, color: '#ef4444' },
  ]
}

function getCategoryData(items: Array<{ category: string; realStock: number }>) {
  const map: Record<string, number> = {}
  items.forEach(item => {
    map[item.category] = (map[item.category] || 0) + item.realStock
  })
  return Object.entries(map).map(([name, value]) => ({ name, value }))
}

const TX_LABELS: Record<string, { label: string; color: 'success' | 'danger' | 'warning' | 'default' | 'secondary' }> = {
  receive: { label: 'Nhập kho', color: 'success' },
  ship: { label: 'Xuất kho', color: 'danger' },
  adjust: { label: 'Điều chỉnh', color: 'warning' },
  transfer: { label: 'Chuyển kho', color: 'default' },
  return: { label: 'Hoàn trả', color: 'secondary' },
}

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  delta?: string
  deltaUp?: boolean
  icon: React.ElementType
  gradient: string
  onClick?: () => void
}

function KpiCard({ label, value, sub, delta, deltaUp, icon: Icon, gradient, onClick }: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${onClick ? 'active:scale-[0.98]' : ''}`}
      style={{ background: gradient }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <Icon size={18} className="text-white" />
        </div>
        {delta && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full bg-white/20 text-white`}>
            {deltaUp ? <ArrowUpRight size={11} /> : <TrendingDown size={11} />}
            {delta}
          </span>
        )}
      </div>
      <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1 truncate">{label}</p>
      <p className="text-white font-bold text-xl sm:text-2xl num break-all leading-tight">{value}</p>
      {sub && <p className="text-white/50 text-xs mt-1 truncate">{sub}</p>}
      {/* Decorative circle */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
      <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-white/8 rounded-full" />
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-xs" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { items } = useItems()
  const { transactions } = useTransactions()

  const totalRealStock = items.reduce((a, b) => a + b.realStock, 0)
  const totalValue = items.reduce((a, b) => a + b.realStock * b.costPrice, 0)
  const lowStockItems = items.filter(i => i.realStock > 0 && i.realStock <= i.reorderPoint)
  const outOfStockItems = items.filter(i => i.realStock === 0)

  const monthlyData = getMonthlyChartData(transactions)
  const stockStatusData = getStockStatusData(items)
  const categoryData = getCategoryData(items)

  const topByStock = [...items].sort((a, b) => b.realStock - a.realStock).slice(0, 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto animate-fade-in">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Tổng mặt hàng"
          value={formatNumber(items.length)}
          sub="trong hệ thống"
          delta="+3 tháng này"
          deltaUp
          icon={Package}
          gradient="linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)"
          onClick={() => navigate('/inventory')}
        />
        <KpiCard
          label="Giá trị tồn kho"
          value={formatCurrencyCompact(totalValue) + ' ₫'}
          sub={formatCurrency(totalValue) + ' — giá vốn'}
          delta="+5.2%"
          deltaUp
          icon={DollarSign}
          gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
        />
        <KpiCard
          label="Sắp hết hàng"
          value={String(lowStockItems.length)}
          sub="mặt hàng cần nhập"
          icon={AlertTriangle}
          gradient={lowStockItems.length > 0
            ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            : "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"}
          onClick={() => navigate('/inventory')}
        />
        <KpiCard
          label="Hết hàng"
          value={String(outOfStockItems.length)}
          sub="cần xử lý gấp"
          icon={ShoppingCart}
          gradient={outOfStockItems.length > 0
            ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
            : "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"}
          onClick={() => navigate('/inventory')}
        />
      </div>

      {/* Alert banner */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={17} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">
              {outOfStockItems.length > 0 ? `${outOfStockItems.length} mặt hàng hết hàng, ` : ''}
              {lowStockItems.length} mặt hàng sắp hết
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[...outOfStockItems, ...lowStockItems].slice(0, 4).map(item => (
                <span key={item.id} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{item.name}</span>
              ))}
              {(lowStockItems.length + outOfStockItems.length) > 4 && (
                <span className="text-xs text-amber-500">+{lowStockItems.length + outOfStockItems.length - 4} khác</span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 flex-shrink-0"
          >
            Xem ngay <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#e4e7ef]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-slate-900 text-[15px]">Nhập / Xuất kho</h3>
              <p className="text-xs text-slate-400 mt-0.5">6 tháng gần đây</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Nhập</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-400" />Xuất</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorReceive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f7cff" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f7cff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorShip" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f8" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9aa0b4' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9aa0b4' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="receive" name="Nhập kho" stroke="#4f7cff" strokeWidth={2} fill="url(#colorReceive)" dot={{ fill: '#4f7cff', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="ship" name="Xuất kho" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorShip)" dot={{ fill: '#8b5cf6', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl p-5 border border-[#e4e7ef] flex flex-col">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900 text-[15px]">Trạng thái tồn kho</h3>
            <p className="text-xs text-slate-400 mt-0.5">{items.length} mặt hàng</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={stockStatusData} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {stockStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e7ef', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2.5 mt-2">
            {stockStatusData.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-sm text-slate-600">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ background: d.color, width: `${(d.value / items.length) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 num w-5 text-right">{d.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-[#e4e7ef]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-[15px]">Theo danh mục</h3>
              <p className="text-xs text-slate-400 mt-0.5">Số lượng tồn kho thực</p>
            </div>
            <BarChart2 size={15} className="text-slate-300" />
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={categoryData} layout="vertical" barCategoryGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f8" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9aa0b4' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#5c6478' }} axisLine={false} tickLine={false} width={95} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f7f8fc' }} />
              <Bar dataKey="value" name="Số lượng" radius={[0, 6, 6, 0]} fill="#4f7cff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e4e7ef] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-slate-400" />
              <h3 className="font-semibold text-slate-900 text-[15px]">Giao dịch gần đây</h3>
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Tất cả <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex-1 divide-y divide-slate-50">
            {recentTransactions.map(tx => {
              const meta = TX_LABELS[tx.type]
              const isPositive = tx.quantity > 0
              return (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {isPositive
                      ? <TrendingUp size={13} className="text-emerald-500" />
                      : <TrendingDown size={13} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 truncate">{tx.itemName}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={meta.color} className="text-[10px]">{meta.label}</Badge>
                    <p className={`text-xs font-bold num mt-0.5 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                      {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top items table */}
      <div className="bg-white rounded-2xl border border-[#e4e7ef] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-[15px]">Top mặt hàng tồn kho</h3>
          <button onClick={() => navigate('/inventory')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            Xem tất cả <ChevronRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-100">
                {['#', 'Mặt hàng', 'Danh mục', 'Nhà CC', 'Tồn thực', 'Tồn sổ sách', 'Ngưỡng', 'Giá trị'].map(h => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topByStock.map((item, i) => {
                const diff = item.realStock - item.invoiceStock
                const itemValue = item.realStock * item.costPrice
                const isLow = item.realStock <= item.reorderPoint
                return (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-[#f7f8fc] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-slate-400">{i + 1}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-800 text-[13px]">{item.name}</span>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">{item.sku}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="secondary">{item.category}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-500">{item.supplier}</td>
                    <td className="px-5 py-3.5">
                      <span className={`num font-semibold text-[13px] ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                        {formatNumber(item.realStock)}
                      </span>
                      {isLow && <AlertTriangle size={11} className="inline ml-1 text-amber-500" />}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="num text-[13px] text-slate-600">{formatNumber(item.invoiceStock)}</span>
                      {diff !== 0 && (
                        <span className={`ml-1.5 text-[10px] font-semibold ${diff > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {diff > 0 ? '+' : ''}{diff}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] num text-slate-400">{formatNumber(item.reorderPoint)}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] font-semibold text-blue-600 num">{formatCurrency(itemValue)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
