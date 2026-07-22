import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Bell, X, AlertTriangle, Package, CheckCircle, Clock } from 'lucide-react'
import { cn } from '../lib/utils'
import { useItems } from '../hooks/useData'

interface Notification {
  id: string
  type: 'out' | 'low' | 'info'
  title: string
  body: string
  time: string
  read: boolean
  itemId?: string
}

function buildNotifications(items: { id: string; name: string; realStock: number; reorderPoint: number; unit: string }[]): Notification[] {
  const nots: Notification[] = []

  items.forEach(item => {
    if (item.realStock === 0) {
      nots.push({
        id: `out-${item.id}`,
        type: 'out',
        title: 'Hết hàng',
        body: `${item.name} đã hết hàng (0 ${item.unit})`,
        time: 'Vừa rồi',
        read: false,
        itemId: item.id,
      })
    } else if (item.realStock <= item.reorderPoint) {
      nots.push({
        id: `low-${item.id}`,
        type: 'low',
        title: 'Sắp hết hàng',
        body: `${item.name} còn ${item.realStock}/${item.reorderPoint} ${item.unit}`,
        time: 'Vừa rồi',
        read: false,
        itemId: item.id,
      })
    }
  })

  nots.push({
    id: 'info-1',
    type: 'info',
    title: 'Hệ thống',
    body: 'Dữ liệu kho đang đồng bộ từ backend',
    time: 'Mới',
    read: items.length === 0,
  })

  return nots
}

const TYPE_CFG = {
  out: { icon: X, iconClass: 'text-red-500', bg: 'bg-red-50 border-red-100' },
  low: { icon: AlertTriangle, iconClass: 'text-amber-500', bg: 'bg-amber-50 border-amber-100' },
  info: { icon: CheckCircle, iconClass: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' },
}

export default function NotificationPanel() {
  const navigate = useNavigate()
  const { items } = useItems()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(() => buildNotifications(items))
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    setNotifications(buildNotifications(items))
  }, [items])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const dismiss = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id))

  const handleClick = (n: Notification) => {
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    if (n.itemId) navigate('/inventory')
    setOpen(false)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'relative p-2 rounded-xl transition-colors text-slate-500',
          open ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 hover:text-slate-900'
        )}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#e4e7ef] rounded-2xl shadow-xl z-50 animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 text-sm">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} mới</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TYPE_CFG[n.type]
                const Icon = cfg.icon
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      'flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50',
                      !n.read && 'bg-blue-50/40'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border mt-0.5', cfg.bg)}>
                      <Icon size={14} className={cfg.iconClass} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-[13px] font-medium', n.read ? 'text-slate-600' : 'text-slate-900')}>{n.title}</p>
                        <button
                          onClick={e => { e.stopPropagation(); dismiss(n.id) }}
                          className="text-slate-300 hover:text-slate-500 flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock size={10} /> {n.time}
                      </p>
                    </div>
                    {!n.read && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => { navigate('/inventory'); setOpen(false) }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium w-full text-center"
            >
              Xem tất cả trong Kho hàng →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
