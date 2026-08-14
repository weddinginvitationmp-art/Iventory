import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router'
import {
  LayoutDashboard, Package, ArrowLeftRight, BookOpen, LogOut,
  Menu, ChevronRight, Boxes, AlertTriangle, Search, FileText,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useItems } from '../hooks/useData'
import CommandPalette from './CommandPalette'
import NotificationPanel from './NotificationPanel'
import ProfileModal from './ProfileModal'

const NAV_ITEMS = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/inventory', label: 'Kho hàng', icon: Package },
  { to: '/transactions', label: 'Giao dịch', icon: ArrowLeftRight },
  { to: '/quotation', label: 'Báo giá', icon: FileText },
  { to: '/docs', label: 'Hướng dẫn', icon: BookOpen },
]

const PAGE_TITLES: Record<string, string> = {
  '/': 'Tổng quan',
  '/inventory': 'Kho hàng',
  '/transactions': 'Giao dịch',
  '/quotation': 'Báo giá',
  '/docs': 'Hướng dẫn',
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const { items } = useItems()
  const lowStockCount = items.filter(i => i.realStock > 0 && i.realStock <= i.reorderPoint).length
  const outOfStockCount = items.filter(i => i.realStock === 0).length
  const alertCount = lowStockCount + outOfStockCount

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Iventory'

  const handleLogout = () => {
    localStorage.removeItem('iventory_user')
    sessionStorage.removeItem('supabase_access_token')
    navigate('/auth')
  }

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('iventory_user') || '{}') } catch { return {} }
  })()
  const initials = (user.name || 'A').slice(0, 1).toUpperCase()

  const SidebarContent = () => (
    <div className="flex flex-col h-full dark-scroll overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5 flex-shrink-0">
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Boxes size={16} className="text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a0d14]" />
        </div>
        <div>
          <span className="text-white font-bold text-[15px] tracking-tight">Iventory</span>
          <p className="text-[10px] text-slate-500 -mt-0.5 font-medium uppercase tracking-widest">Warehouse</p>
        </div>
      </div>

      {/* Search hint */}
      <div className="px-3 pt-4 pb-2 flex-shrink-0">
        <button
          onClick={() => document.dispatchEvent(new CustomEvent('open-command'))}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 border border-white/6 text-slate-500 text-xs transition-colors group"
        >
          <Search size={12} />
          <span className="flex-1 text-left">Tìm kiếm...</span>
          <kbd className="bg-white/8 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto dark-scroll">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2 mb-2">Điều hướng</p>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 group relative',
                isActive
                  ? 'bg-white/8 text-white font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-full" />
                )}
                <Icon size={16} className={cn('flex-shrink-0 transition-colors', isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300')} />
                <span className="flex-1">{label}</span>
                {to === '/inventory' && alertCount > 0 && (
                  <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{alertCount}</span>
                )}
                {isActive && <ChevronRight size={12} className="text-slate-600" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Stats */}
      <div className="px-3 pb-3 flex-shrink-0 space-y-1.5 border-t border-white/5 pt-3">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-1 mb-2">Thống kê nhanh</p>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-white/4 rounded-xl p-2.5">
            <p className="text-white font-bold text-base num">{items.length}</p>
            <p className="text-slate-500 text-[10px]">Mặt hàng</p>
          </div>
          <div className={cn('rounded-xl p-2.5', alertCount > 0 ? 'bg-red-500/10' : 'bg-white/4')}>
            <p className={cn('font-bold text-base num', alertCount > 0 ? 'text-red-400' : 'text-white')}>{alertCount}</p>
            <p className="text-slate-500 text-[10px]">Cảnh báo</p>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-3 pb-4 flex-shrink-0 border-t border-white/5 pt-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group cursor-default">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-md shadow-blue-500/20">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-semibold truncate">{user.name || 'Admin'}</p>
            <p className="text-slate-500 text-[11px] truncate">{user.email || 'admin@iventory.vn'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-lg opacity-0 group-hover:opacity-100"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#f7f8fc] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-col flex-shrink-0 bg-[#0a0d14]">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-[#0a0d14] animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-5 bg-white border-b border-[#e4e7ef] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-[15px] font-semibold text-slate-900">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search trigger */}
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('open-command'))}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500 text-xs"
            >
              <Search size={13} />
              <span>Tìm kiếm</span>
              <kbd className="bg-white text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200">⌘K</kbd>
            </button>

            {/* Notification bell */}
            <NotificationPanel />

            {/* Avatar */}
            <button
              onClick={() => setProfileOpen(true)}
              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-white text-xs font-bold cursor-pointer shadow-sm hover:opacity-90 transition-opacity"
              title="Tài khoản"
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Command palette — inside router context */}
      <CommandPalette />

      {/* Profile modal */}
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onLogout={handleLogout}
      />
    </div>
  )
}
