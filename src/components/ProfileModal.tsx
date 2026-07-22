import { useState, useEffect } from 'react'
import { User, Mail, Shield, LogOut, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface ProfileModalProps {
  open: boolean
  onClose: () => void
  onLogout: () => void
}

export default function ProfileModal({ open, onClose, onLogout }: ProfileModalProps) {
  const [editMode, setEditMode] = useState(false)
  const [user, setUser] = useState({ name: 'Admin', email: 'admin@iventory.vn', role: 'Quản trị viên' })
  const [draft, setDraft] = useState(user)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('iventory_user') || '{}')
      const merged = { name: stored.name || 'Admin', email: stored.email || 'admin@iventory.vn', role: stored.role || 'Quản trị viên' }
      setUser(merged)
      setDraft(merged)
    } catch {}
  }, [open])

  const initials = user.name.slice(0, 2).toUpperCase()

  const handleSave = () => {
    if (!draft.name.trim() || !draft.email.trim()) return
    const stored = JSON.parse(localStorage.getItem('iventory_user') || '{}')
    const updated = { ...stored, name: draft.name.trim(), email: draft.email.trim() }
    localStorage.setItem('iventory_user', JSON.stringify(updated))
    setUser(draft)
    setEditMode(false)
    toast.success('Đã cập nhật thông tin')
  }

  const handleLogout = () => {
    onClose()
    onLogout()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tài khoản"
      size="sm"
      footer={
        editMode ? (
          <>
            <Button variant="outline" onClick={() => { setDraft(user); setEditMode(false) }}>
              <X size={13} /> Hủy
            </Button>
            <Button onClick={handleSave} disabled={!draft.name.trim() || !draft.email.trim()}>
              <Save size={13} /> Lưu thay đổi
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setEditMode(true)}>
              Chỉnh sửa
            </Button>
            <Button
              variant="ghost"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut size={13} /> Đăng xuất
            </Button>
          </>
        )
      }
    >
      <div className="space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 pt-1">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield size={15} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-blue-500 font-semibold">Vai trò</p>
            <p className="text-sm text-blue-800 font-medium">{user.role}</p>
          </div>
        </div>

        {/* Fields */}
        {editMode ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User size={11} /> Họ và tên
              </label>
              <Input
                value={draft.name}
                onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
                placeholder="Nhập họ tên..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={11} /> Email
              </label>
              <Input
                type="email"
                value={draft.email}
                onChange={e => setDraft(p => ({ ...p, email: e.target.value }))}
                placeholder="Nhập email..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {[
              { icon: User, label: 'Họ và tên', value: user.name },
              { icon: Mail, label: 'Email', value: user.email },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Icon size={14} className="text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{label}</p>
                  <p className="text-sm text-slate-800 font-medium truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
