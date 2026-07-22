import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
  Search, LayoutDashboard, Package, ArrowLeftRight, BookOpen,
  ArrowRight, X, Plus, TrendingUp,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useItems } from '../hooks/useData'

interface Cmd {
  id: string
  group: string
  label: string
  sublabel?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  action: (navigate: ReturnType<typeof useNavigate>) => void
}

const STATIC_CMDS: Cmd[] = [
  {
    id: 'nav-dashboard', group: 'Điều hướng',
    label: 'Tổng quan', sublabel: 'Dashboard & biểu đồ',
    icon: LayoutDashboard, iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
    action: nav => nav('/'),
  },
  {
    id: 'nav-inventory', group: 'Điều hướng',
    label: 'Kho hàng', sublabel: 'Quản lý mặt hàng',
    icon: Package, iconBg: 'bg-violet-50', iconColor: 'text-violet-500',
    action: nav => nav('/inventory'),
  },
  {
    id: 'nav-tx', group: 'Điều hướng',
    label: 'Giao dịch', sublabel: 'Lịch sử nhập xuất kho',
    icon: ArrowLeftRight, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500',
    action: nav => nav('/transactions'),
  },
  {
    id: 'nav-docs', group: 'Điều hướng',
    label: 'Hướng dẫn sử dụng', sublabel: 'Tài liệu & FAQ',
    icon: BookOpen, iconBg: 'bg-amber-50', iconColor: 'text-amber-500',
    action: nav => nav('/docs'),
  },
  {
    id: 'action-add', group: 'Hành động',
    label: 'Thêm mặt hàng mới', sublabel: 'Mở trang Kho hàng',
    icon: Plus, iconBg: 'bg-slate-100', iconColor: 'text-slate-500',
    action: nav => nav('/inventory'),
  },
  {
    id: 'action-tx', group: 'Hành động',
    label: 'Ghi giao dịch mới', sublabel: 'Mở trang Giao dịch',
    icon: TrendingUp, iconBg: 'bg-slate-100', iconColor: 'text-slate-500',
    action: nav => nav('/transactions'),
  },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { items } = useItems()

  // Listen for Cmd+K / Ctrl+K and custom event
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape' && open) setOpen(false)
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    document.addEventListener('open-command', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('open-command', onOpen)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const results = useMemo<{ group: string; items: Cmd[] }[]>(() => {
    const q = query.toLowerCase().trim()

    const matchedStatic = STATIC_CMDS.filter(c =>
      !q ||
      c.label.toLowerCase().includes(q) ||
      (c.sublabel || '').toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q)
    )

    const matchedItems: Cmd[] = !q ? [] : items
      .filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(item => ({
        id: `item-${item.id}`,
        group: 'Mặt hàng',
        label: item.name,
        sublabel: `SKU: ${item.sku} · Tồn: ${item.realStock} ${item.unit} · ${item.category}`,
        icon: Package,
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-500',
        action: (nav: ReturnType<typeof useNavigate>) => nav('/inventory'),
      }))

    const groups: { group: string; items: Cmd[] }[] = []

    const navGroup = matchedStatic.filter(c => c.group === 'Điều hướng')
    const actionGroup = matchedStatic.filter(c => c.group === 'Hành động')

    if (navGroup.length) groups.push({ group: 'Điều hướng', items: navGroup })
    if (actionGroup.length) groups.push({ group: 'Hành động', items: actionGroup })
    if (matchedItems.length) groups.push({ group: 'Mặt hàng', items: matchedItems })

    return groups
  }, [query])

  const allItems = results.flatMap(g => g.items)

  const run = (cmd: Cmd) => {
    cmd.action(navigate)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, allItems.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && allItems[cursor]) run(allItems[cursor])
  }

  if (!open) return null

  let idx = 0

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0) }}
            onKeyDown={onKeyDown}
            placeholder="Tìm trang, mặt hàng, danh mục..."
            className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-0.5">
              <X size={14} />
            </button>
          ) : (
            <kbd className="text-slate-400 text-[11px] font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">ESC</kbd>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto">
          {allItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-400">Không tìm thấy kết quả cho &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <div className="py-1.5">
              {results.map(group => (
                <div key={group.group}>
                  <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {group.group}
                  </p>
                  {group.items.map(cmd => {
                    const i = idx++
                    const Icon = cmd.icon
                    const isActive = cursor === i
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => run(cmd)}
                        onMouseEnter={() => setCursor(i)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isActive ? 'bg-[#f0f4ff]' : 'hover:bg-slate-50'
                        )}
                      >
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', cmd.iconBg)}>
                          <Icon size={15} className={cmd.iconColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-slate-900">{cmd.label}</p>
                          {cmd.sublabel && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{cmd.sublabel}</p>
                          )}
                        </div>
                        {isActive && <ArrowRight size={14} className="text-blue-400 flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 bg-slate-50/60 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px]">↑↓</kbd> Điều hướng</span>
          <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px]">↵</kbd> Chọn</span>
          <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px]">Esc</kbd> Đóng</span>
          <span className="ml-auto">{allItems.length} kết quả</span>
        </div>
      </div>
    </div>
  )
}
