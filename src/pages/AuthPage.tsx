import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Eye, EyeOff, ArrowRight, Boxes, Mail, Lock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { cn } from '../lib/utils'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) return
    setLoading(true)

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
        if (error) throw error
        if (!data.session?.access_token) throw new Error('Không nhận được phiên đăng nhập')

        sessionStorage.setItem('supabase_access_token', data.session.access_token)
        localStorage.setItem('iventory_user', JSON.stringify({
          email: data.user?.email ?? form.email,
          name: ((data.user?.user_metadata as any)?.name ?? form.name) || 'Admin',
        }))

        toast.success('Đăng nhập thành công!')
        navigate('/')
      } else {
        const { data, error } = await supabase.auth.signUp(
          { email: form.email, password: form.password },
          { data: { name: form.name } },
        )
        if (error) throw error

        toast.success('Đăng ký thành công! Vui lòng xác thực email nếu cần.')
        setMode('login')
      }
    } catch (err: any) {
      toast.error(err.message || 'Đã xảy ra lỗi khi xác thực')
    } finally {
      setLoading(false)
    }
  }

  const FEATURES = [
    'Quản lý kho hàng thời gian thực',
    'Biểu đồ phân tích nhập/xuất',
    'Cảnh báo tự động khi hết hàng',
    'Ghi nhận đầy đủ lịch sử giao dịch',
  ]

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left — brand panel */}
      <div className="hidden lg:flex w-[52%] relative bg-[#0a0d14] flex-col justify-between p-14 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(#4f7cff 1px, transparent 1px), linear-gradient(90deg, #4f7cff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glows */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-violet-600/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Boxes size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-xl tracking-tight">Iventory</span>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Warehouse</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative space-y-6 max-w-sm">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1.5">
            <Sparkles size={12} className="text-blue-400" />
            <span className="text-blue-400 text-xs font-medium">Quản lý kho thông minh</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-[1.15] tracking-tight">
            Kiểm soát kho hàng<br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              chính xác hơn
            </span>
          </h1>

          <p className="text-slate-400 leading-relaxed">
            Nền tảng quản lý kho hàng hiện đại — theo dõi tồn kho, phân tích giao dịch và nhận cảnh báo tự động trong một nơi duy nhất.
          </p>

          <div className="space-y-2.5 pt-2">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-blue-500/15 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                </div>
                <span className="text-sm text-slate-400">{f}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[{ v: '1,200+', l: 'Mặt hàng' }, { v: '50k+', l: 'Giao dịch' }, { v: '99.9%', l: 'Chính xác' }].map(s => (
              <div key={s.l} className="bg-white/5 rounded-2xl p-3.5 border border-white/6">
                <p className="text-white font-bold text-xl num">{s.v}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-slate-700 text-xs">© 2024 Iventory · All rights reserved.</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white lg:bg-slate-50">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Boxes size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Iventory</span>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-2xl p-1 mb-8">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all',
                  mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </button>
            ))}
          </div>

          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản'}
            </h2>
            <p className="text-slate-500 text-sm">
              {mode === 'login' ? 'Nhập thông tin để tiếp tục.' : 'Điền đầy đủ thông tin bên dưới.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Họ tên</label>
                <Input placeholder="Nguyễn Văn A" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input type="email" placeholder="admin@iventory.vn" className="pl-9" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mật khẩu</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-9 pr-10" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-10" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                  <ArrowRight size={15} />
                </span>
              )}
            </Button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
              <Sparkles size={11} className="text-blue-500" /> Demo — nhập bất kỳ
            </p>
            <div className="space-y-1 font-mono text-xs text-slate-500">
              <p>Email: <span className="text-blue-600">admin@iventory.vn</span></p>
              <p>Password: <span className="text-blue-600">bất kỳ chuỗi nào</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

