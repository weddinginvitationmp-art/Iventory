import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Package, FileText, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getItems(), api.getTransactions()])
      .then(([itemsData, txData]) => {
        setItems(itemsData);
        setTransactions(txData);
      })
      .catch((err) => toast.error("Lỗi khi tải dữ liệu: " + err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalRealStock = items.reduce((acc, item) => acc + (item.realStock || 0), 0);
  const totalInvoiceStock = items.reduce((acc, item) => acc + (item.invoiceStock || 0), 0);
  const lowStockItems = items.filter(i => (i.realStock || 0) < 10).length;
  
  // Format transactions for timeline chart (last 7 days grouped by date)
  const chartData = transactions.slice(0, 50).reduce((acc, tx) => {
    const date = new Date(tx.date).toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
    const existing = acc.find((d: any) => d.date === date);
    if (existing) {
      if (tx.type === 'in') existing.nhap += tx.quantity;
      if (tx.type === 'out') existing.xuat += tx.quantity;
    } else {
      acc.push({
        date,
        nhap: tx.type === 'in' ? tx.quantity : 0,
        xuat: tx.type === 'out' ? tx.quantity : 0
      });
    }
    return acc;
  }, []).reverse();

  if (loading) return <div className="p-8 animate-pulse space-y-4">
    <div className="h-32 bg-zinc-200 rounded-xl"></div>
    <div className="h-64 bg-zinc-200 rounded-xl"></div>
  </div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Tổng quan</h1>
        <p className="text-zinc-500">Giám sát tồn kho thực tế và sổ sách theo thời gian thực.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Tồn kho Thực tế</CardTitle>
            <Package className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{totalRealStock}</div>
            <p className="text-xs text-emerald-600/80 mt-1">Đơn vị sản phẩm vật lý</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Tồn kho Hóa đơn</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{totalInvoiceStock}</div>
            <p className="text-xs text-blue-600/80 mt-1">Ghi nhận trên sổ sách</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Sản phẩm sắp hết</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{lowStockItems}</div>
            <p className="text-xs text-zinc-500 mt-1">Dưới 10 đơn vị</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Giao dịch gần đây</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{transactions.length}</div>
            <p className="text-xs text-zinc-500 mt-1">Tổng lịch sử ghi nhận</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Biểu đồ Nhập - Xuất</CardTitle>
            <CardDescription>Theo dõi biến động kho hàng trong thời gian qua</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Line type="monotone" name="Nhập kho" dataKey="nhap" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Xuất kho" dataKey="xuat" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 overflow-hidden">
          <CardHeader>
            <CardTitle>Dòng thời gian gần đây</CardTitle>
            <CardDescription>Các hoạt động mới nhất trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {transactions.slice(0, 5).map((tx, idx) => {
                const item = items.find(i => i.id === tx.itemId);
                const isNhập = tx.type === 'in';
                const Icon = isNhập ? ArrowDownRight : ArrowUpRight;
                return (
                  <div key={tx.id} className="relative flex gap-4">
                    {idx !== transactions.slice(0, 5).length - 1 && (
                      <div className="absolute left-4 top-10 -ml-px h-full w-0.5 bg-zinc-200" aria-hidden="true" />
                    )}
                    <div className={`relative flex h-8 w-8 flex-none items-center justify-center rounded-full ${
                      tx.type === 'in' ? 'bg-emerald-100 text-emerald-600' :
                      tx.type === 'out' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-auto py-0.5">
                      <p className="text-sm font-medium text-zinc-900">
                        {tx.type === 'in' ? 'Nhập' : tx.type === 'out' ? 'Xuất' : 'Điều chỉnh'} {tx.quantity} {item?.unit || 'đơn vị'}
                      </p>
                      <p className="text-xs text-zinc-500">Sản phẩm: {item?.name || 'Không rõ'} - Ghi chú: {tx.note || 'Không'}</p>
                    </div>
                    <time className="flex-none py-0.5 text-xs text-zinc-500">
                      {new Date(tx.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                    </time>
                  </div>
                );
              })}
              {transactions.length === 0 && (
                <div className="text-center text-sm text-zinc-500 py-8">Chưa có giao dịch nào</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}