import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Plus, ArrowDownRight, ArrowUpRight, Scale, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TransactionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [itemsData, txData] = await Promise.all([api.getItems(), api.getTransactions()]);
      setItems(itemsData);
      setTransactions(txData);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const txData = {
      itemId: formData.get("itemId"),
      type: formData.get("type"), // 'in', 'out', 'adjust'
      stockType: formData.get("stockType"), // 'real', 'invoice', 'both'
      quantity: Number(formData.get("quantity")),
      note: formData.get("note"),
      date: new Date().toISOString()
    };

    if (!txData.itemId || !txData.type || !txData.stockType || !txData.quantity) {
      toast.error("Vui lòng điền đủ thông tin");
      setSubmitting(false);
      return;
    }

    try {
      await api.createTransaction(txData);
      toast.success("Đã ghi nhận giao dịch");
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Quản lý giao dịch</h1>
          <p className="text-zinc-500">Lịch sử nhập, xuất và điều chỉnh kho hàng.</p>
        </div>
        <Button 
          className="gap-2 shrink-0" 
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" /> Ghi nhận mới
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50">
            Chưa có giao dịch nào được ghi nhận.
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent">
            {transactions.map((tx, index) => {
              const item = items.find((i) => i.id === tx.itemId);
              const isNhập = tx.type === 'in';
              const isXuất = tx.type === 'out';
              const isĐiềuChỉnh = tx.type === 'adjust';
              
              const Icon = isNhập ? ArrowDownRight : isXuất ? ArrowUpRight : Scale;
              const bgColor = isNhập ? "bg-emerald-50 border-emerald-100" : isXuất ? "bg-rose-50 border-rose-100" : "bg-blue-50 border-blue-100";
              const iconColor = isNhập ? "text-emerald-600 bg-emerald-100" : isXuất ? "text-rose-600 bg-rose-100" : "text-blue-600 bg-blue-100";
              
              return (
                <div key={tx.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] px-4">
                    <Card className={`border shadow-sm transition-shadow hover:shadow-md ${bgColor}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-semibold text-zinc-900 line-clamp-1">{item?.name || "Không rõ"}</h3>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                            isNhập ? "text-emerald-700 bg-emerald-100/50" : 
                            isXuất ? "text-rose-700 bg-rose-100/50" : 
                            "text-blue-700 bg-blue-100/50"
                          }`}>
                            {isNhập ? "+ Nhập" : isXuất ? "- Xuất" : "Điều chỉnh"} {tx.quantity} {item?.unit || ''}
                          </span>
                        </div>
                        <div className="flex gap-4 items-center text-xs text-zinc-500 mb-3">
                          <span className="flex items-center gap-1.5">
                            Áp dụng: <strong className="font-medium text-zinc-700">
                              {tx.stockType === 'real' ? 'Thực tế' : tx.stockType === 'invoice' ? 'Sổ sách' : 'Cả hai'}
                            </strong>
                          </span>
                          <span>•</span>
                          <time>{new Date(tx.date).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}</time>
                        </div>
                        {tx.note && (
                          <p className="text-sm text-zinc-600 bg-white/50 p-2.5 rounded-lg border border-zinc-100/50">
                            "{tx.note}"
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 p-4 px-6">
              <h2 className="text-lg font-semibold">Ghi nhận giao dịch</h2>
              <button 
                className="text-zinc-400 hover:text-zinc-600"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="space-y-5 p-6">
                <div className="space-y-2">
                  <Label>Sản phẩm *</Label>
                  <select 
                    name="itemId" 
                    required
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Tồn thực: {item.realStock} | Sổ sách: {item.invoiceStock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Loại giao dịch *</Label>
                    <select 
                      name="type" 
                      required
                      className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
                    >
                      <option value="in">Nhập kho</option>
                      <option value="out">Xuất kho</option>
                      <option value="adjust">Điều chỉnh (+/-)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Phạm vi áp dụng *</Label>
                    <select 
                      name="stockType" 
                      required
                      className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
                    >
                      <option value="both">Cả hai (Thực tế & Sổ sách)</option>
                      <option value="real">Chỉ Thực tế</option>
                      <option value="invoice">Chỉ Sổ sách</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Số lượng * (Nhập số lượng tổng nếu là Điều chỉnh)</Label>
                  <Input name="quantity" type="number" step="any" required placeholder="Ví dụ: 10, 5..." />
                </div>

                <div className="space-y-2">
                  <Label>Ghi chú</Label>
                  <Input name="note" placeholder="Ví dụ: Khách hoàn trả, chênh lệch kiểm kê..." />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 border-t border-zinc-100 bg-zinc-50/50 p-4 px-6 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>Hủy</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Xác nhận
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}