import { createBrowserRouter, RouterProvider, Navigate } from 'react-router'
import { Toaster } from 'sonner'
import AppLayout from './components/AppLayout'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import InventoryPage from './pages/InventoryPage'
import TransactionsPage from './pages/TransactionsPage'
import QuotationPage from './pages/QuotationPage'
import DocsPage from './pages/DocsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem('supabase_access_token')
  if (!token) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function NotFound() {
  return (
    <div className="flex h-full items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <p className="text-7xl font-black text-slate-100">404</p>
        <p className="text-lg font-semibold text-slate-700">Trang không tồn tại</p>
        <p className="text-slate-400 text-sm">Đường dẫn bạn truy cập không hợp lệ.</p>
        <a href="/" className="inline-block mt-2 text-sm font-medium text-blue-600 hover:underline">← Quay về trang chủ</a>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/auth', element: <AuthPage /> },
  {
    path: '/',
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'quotation', element: <QuotationPage /> },
      { path: 'docs', element: <DocsPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors expand />
    </>
  )
}
