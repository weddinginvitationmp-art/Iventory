import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Package, Search, Plus, Edit2, Trash2, X, DownloadCloud } from "lucide-react";
import { toast } from "sonner";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const loadItems = async () => {
    try {
      const data = await api.getItems();
      setItems(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const itemData = {
      name: formData.get("name"),
      sku: formData.get("sku"),
      category: formData.get("category"),
      unit: formData.get("unit"),
      realStock: Number(formData.get("realStock") || 0),
      invoiceStock: Number(formData.get("invoiceStock") || 0),
    };

    try {
      if (editingItem) {
        await api.updateItem(editingItem.id, itemData);
        toast.success("Đã cập nhật sản phẩm");
      } else {
        await api.createItem(itemData);
        toast.success("Đã thêm sản phẩm mới");
      }
      setIsModalOpen(false);
      loadItems();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      await api.deleteItem(id);
      toast.success("Đã xóa sản phẩm");
      loadItems();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredItems = items.filter(
    (item) => 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      item.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Danh mục sản phẩm</h1>
          <p className="text-zinc-500">Quản lý danh sách hàng hóa và tồn kho hiện tại.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => toast.success("Mô phỏng: Đã tải xuống file Excel")}>
            <DownloadCloud className="h-4 w-4" /> Xuất Excel
          </Button>
          <Button 
            className="gap-2" 
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Thêm sản phẩm
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
        <Input 
          placeholder="Tìm kiếm theo tên hoặc mã SKU..." 
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <Card key={item.id} className="group overflow-hidden border-zinc-200/60 transition-all hover:border-zinc-300 hover:shadow-md">
            <CardContent className="p-5 flex flex-col h-full justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 leading-tight">{item.name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{item.sku || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button 
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-md hover:bg-zinc-100 transition-colors"
                      onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-medium mb-1">Thực tế</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-emerald-700 leading-none">{item.realStock}</span>
                      <span className="text-xs text-emerald-600/80">{item.unit || 'cái'}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-2.5 border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium mb-1">Sổ sách</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-blue-700 leading-none">{item.invoiceStock}</span>
                      <span className="text-xs text-blue-600/80">{item.unit || 'cái'}</span>
                    </div>
                  </div>
                </div>
              </div>
              {item.category && (
                <div className="mt-4 inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 w-fit">
                  {item.category}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filteredItems.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-zinc-500">
            Không tìm thấy sản phẩm nào.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 p-4 px-6">
              <h2 className="text-lg font-semibold">{editingItem ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
              <button 
                className="text-zinc-400 hover:text-zinc-600"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="space-y-4 p-6">
                <div className="space-y-2">
                  <Label>Tên sản phẩm *</Label>
                  <Input name="name" defaultValue={editingItem?.name} required placeholder="VD: Bàn phím cơ..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mã SKU</Label>
                    <Input name="sku" defaultValue={editingItem?.sku} placeholder="VD: BP01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Đơn vị</Label>
                    <Input name="unit" defaultValue={editingItem?.unit || 'cái'} placeholder="VD: cái, bộ..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Danh mục</Label>
                  <Input name="category" defaultValue={editingItem?.category} placeholder="VD: Điện tử" />
                </div>
                {!editingItem && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tồn thực tế ban đầu</Label>
                      <Input name="realStock" type="number" defaultValue="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tồn sổ sách ban đầu</Label>
                      <Input name="invoiceStock" type="number" defaultValue="0" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 border-t border-zinc-100 bg-zinc-50/50 p-4 px-6 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit">Lưu sản phẩm</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}