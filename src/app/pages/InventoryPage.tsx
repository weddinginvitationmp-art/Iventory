import { useState, useEffect, useRef } from "react";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Package, Search, Plus, Edit2, Trash2, X, DownloadCloud, Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadInventorySummary = async () => {
    try {
      const data = await api.getInventorySummary();
      setItems(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventorySummary();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const itemData = {
      code: formData.get("code"),
      name: formData.get("name"),
      unit: formData.get("unit"),
      warehouse_name: formData.get("warehouse_name") || "Main Warehouse"
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
      loadInventorySummary();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      await api.deleteItem(id);
      toast.success("Đã xóa sản phẩm");
      loadInventorySummary();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const downloadTemplate = () => {
    // Create professional template with sample data in Vietnamese
    const sampleData = [
      {
        name: "Laptop Dell XPS 13",
        sku: "DELL-XPS-13-2024",
        category: "Điện tử",
        unit: "Cái",
        realStock: 15,
        invoiceStock: 12,
        price: 25000000,
        supplier: "Dell Vietnam"
      },
      {
        name: "Chuột Logitech MX Master",
        sku: "LOG-MX-MASTER-3",
        category: "Phụ kiện",
        unit: "Cái",
        realStock: 50,
        invoiceStock: 48,
        price: 2500000,
        supplier: "Logitech Asia"
      },
      {
        name: "Bàn phím cơ Ducky One 2",
        sku: "DUCKY-ONE2-RGB",
        category: "Phụ kiện",
        unit: "Cái",
        realStock: 30,
        invoiceStock: 28,
        price: 3500000,
        supplier: "Ducky Store"
      },
      {
        name: "Monitor Dell S2722DC",
        sku: "DELL-S2722DC-27",
        category: "Màn hình",
        unit: "Cái",
        realStock: 8,
        invoiceStock: 6,
        price: 8500000,
        supplier: "Dell Vietnam"
      },
      {
        name: "Headphone Sony WH-1000XM5",
        sku: "SONY-WH-1000XM5",
        category: "Audio",
        unit: "Cái",
        realStock: 12,
        invoiceStock: 10,
        price: 7500000,
        supplier: "Sony Vietnam"
      }
    ];

    // Convert to CSV format with Vietnamese headers
    const headers = ["tên hàng", "mã hàng", "danh mục", "đvt", "tồn thực tế", "hóa đơn", "đơn giá", "nhà cung cấp"];
    const csvContent = [
      headers.join(","),
      ...sampleData.map(row => 
        headers.map(header => {
          let value;
          switch(header) {
            case "tên hàng": value = row.name; break;
            case "mã hàng": value = row.sku; break;
            case "danh mục": value = row.category; break;
            case "đvt": value = row.unit; break;
            case "tồn thực tế": value = row.realStock; break;
            case "hóa đơn": value = row.invoiceStock; break;
            case "đơn giá": value = row.price; break;
            case "nhà cung cấp": value = row.supplier; break;
            default: value = "";
          }
          // Escape quotes and wrap in quotes if contains comma
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : `"${value}"`;
        }).join(",")
      )
    ].join("\n");

    // Add header with metadata in Vietnamese
    const fullContent = `# Template Import Sản Phẩm
# Tạo ngày: ${new Date().toLocaleString('vi-VN')}
# Định dạng: CSV (Dấu phẩy ngăn cách)
# Cột bắt buộc: tên hàng, mã hàng, danh mục, đvt, tồn thực tế, hóa đơn
# Cột tùy chọn: đơn giá, nhà cung cấp
# Lưu ý: Mỗi sản phẩm phải có mã hàng duy nhất
#
${csvContent}`;

    // Download file with UTF-8 BOM for proper Vietnamese encoding
    const BOM = '\ufeff'; // UTF-8 Byte Order Mark
    const blob = new Blob([BOM + fullContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `template_san_pham_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Đã tải xuống file template với dữ liệu mẫu");
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Chỉ chấp nhận file Excel (.xlsx, .xls)");
      return;
    }

    setImporting(true);
    try {
      const result = await api.importExcel(file, selectedMonth);

      // Show detailed result
      if (result.errors && result.errors.length > 0) {
        toast.error(`Import: ${result.imported}/${result.total} thành công. ${result.errors.length} lỗi:`);
        // Log errors for user to see
        console.error('Import errors:', result.errors);
        result.errors.slice(0, 3).forEach((err: string) => {
          toast.error(err);
        });
        if (result.errors.length > 3) {
          toast.error(`...và ${result.errors.length - 3} lỗi khác`);
        }
      } else {
        toast.success(`✅ Đã import thành công ${result.imported} giao dịch!`);
      }

      loadInventorySummary();

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      toast.error(`Lỗi import: ${err.message}`);
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  const filteredItems = items.filter(
    (item) => 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      item.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Danh mục sản phẩm</h1>
          <p className="text-zinc-500">Quản lý danh sách hàng hóa và tồn kho hiện tại.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="month-select" className="text-sm font-medium">Tháng:</Label>
            <Input
              id="month-select"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-32"
            />
          </div>
          <Button variant="outline" className="gap-2" onClick={downloadTemplate}>
            <FileSpreadsheet className="h-4 w-4" /> Template Excel
          </Button>
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={importing}
            />
            <Button variant="outline" className="gap-2" disabled={importing}>
              <Upload className="h-4 w-4" />
              {importing ? "Đang import..." : "Import Excel"}
            </Button>
          </div>
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
          placeholder="Tìm kiếm theo tên hoặc mã hàng..." 
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
                      <p className="text-xs text-zinc-500 mt-0.5">{item.code || 'N/A'}</p>
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
                    <p className="text-xs text-emerald-600 font-medium mb-1">Tồn thực tế</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-emerald-700 leading-none">{item.real_stock || 0}</span>
                      <span className="text-xs text-emerald-600/80">{item.unit || 'cái'}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-2.5 border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium mb-1">Tồn hóa đơn</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-blue-700 leading-none">{item.invoice_stock || 0}</span>
                      <span className="text-xs text-blue-600/80">{item.unit || 'cái'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div className="text-center">
                    <p className="text-zinc-500">Nhập</p>
                    <p className="font-semibold text-green-600">{item.total_import || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-zinc-500">Xuất</p>
                    <p className="font-semibold text-red-600">{item.total_export || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-zinc-500">Giá TB</p>
                    <p className="font-semibold text-zinc-700">{item.avg_price ? item.avg_price.toLocaleString('vi-VN') : 0}₫</p>
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
                  <Label>Mã hàng *</Label>
                  <Input name="code" defaultValue={editingItem?.code} required placeholder="VD: SP001" />
                </div>
                <div className="space-y-2">
                  <Label>Tên hàng *</Label>
                  <Input name="name" defaultValue={editingItem?.name} required placeholder="VD: Laptop Dell XPS 13" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Đơn vị tính</Label>
                    <Input name="unit" defaultValue={editingItem?.unit || 'cái'} placeholder="VD: cái, bộ..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Kho</Label>
                    <Input name="warehouse_name" defaultValue={editingItem?.warehouse_name || 'Main Warehouse'} placeholder="VD: Kho chính" />
                  </div>
                </div>
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