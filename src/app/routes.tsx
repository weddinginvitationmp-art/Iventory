import { createBrowserRouter } from "react-router";
import AppLayout from "./components/AppLayout";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import TransactionsPage from "./pages/TransactionsPage";

function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-zinc-900 mb-2">404</h1>
        <p className="text-zinc-500 mb-6">Trang bạn tìm kiếm không tồn tại.</p>
        <a href="/" className="text-sm font-medium text-blue-600 hover:underline">Quay lại trang chủ</a>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: AuthPage,
  },
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "inventory", Component: InventoryPage },
      { path: "transactions", Component: TransactionsPage },
      { path: "*", Component: NotFound },
    ],
  },
]);