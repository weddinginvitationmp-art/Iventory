import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
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
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [sortOption, setSortOption] = useState("realStockDesc");
  const [viewMode, setViewMode] = useState<"all" | "low-stock" | "reorder">("all");
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadItems = async () => {
    try {
      const data = await api.getItems();
      setItems(data);
      setCategories(Array.from(new Set(data.map((item: any) => item.category || "Chưa phân loại"))).sort());
      setSuppliers(Array.from(new Set(data.map((item: any) => item.supplier || "Chưa có"))).sort());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    const mode = searchParams.get("view");
    if (mode === "low-stock") {
      setViewMode("low-stock");
      setSortOption("realStockAsc");
    } else if (mode === "reorder") {
      setViewMode("reorder");
      setSortOption("reorderAlert");
    } else {
      setViewMode("all");
    }
  }, [searchParams]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const itemData: any = {
      name: formData.get("name"),
      sku: formData.get("sku"),
      category: formData.get("category"),
      unit: formData.get("unit"),
      supplier: formData.get("supplier"),
      location: formData.get("location"),
      reorderPoint: Number(formData.get("reorderPoint") || 0),
      realStock: Number(formData.get("realStock") || 0),
      invoiceStock: Number(formData.get("invoiceStock") || 0),
    };

    if (imageChanged) {
      itemData.imageUrl = imagePreview || "";
    }

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
        reorderPoint: 8,
        location: "Kho A",
        price: 7500000,
        supplier: "Sony Vietnam"
      }
    ];

    // Convert to CSV format with Vietnamese headers
    const headers = ["tên hàng", "mã hàng", "danh mục", "đvt", "tồn thực tế", "hóa đơn", "điểm tái đặt", "vị trí kho", "đơn giá", "nhà cung cấp"];
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
            case "điểm tái đặt": value = row.reorderPoint; break;
            case "vị trí kho": value = row.location; break;
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
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Chỉ chấp nhận file CSV hoặc Excel (.csv, .xlsx, .xls)");
      return;
    }

    setImporting(true);
    try {
      const result = await api.importItems(file);
      
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
        toast.success(`✅ Đã import thành công ${result.imported}/${result.total} sản phẩm!`);
      }
      
      loadItems();
      
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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setImageChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageChanged(true);
  };

  const filteredItems = items
    .filter((item) => {
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || item.name.toLowerCase().includes(query) || item.sku?.toLowerCase().includes(query);
      const matchesCategory = !filterCategory || (item.category || "Chưa phân loại") === filterCategory;
      const matchesSupplier = !filterSupplier || (item.supplier || "Chưa có") === filterSupplier;
      const matchesView =
        viewMode === "low-stock"
          ? (item.realStock || 0) < 10
          : viewMode === "reorder"
          ? item.reorderPoint !== undefined && (item.realStock || 0) <= item.reorderPoint
          : true;
      return matchesSearch && matchesCategory && matchesSupplier && matchesView;
    })
    .sort((a, b) => {
      if (sortOption === "realStockAsc") return (a.realStock || 0) - (b.realStock || 0);
      if (sortOption === "realStockDesc") return (b.realStock || 0) - (a.realStock || 0);
      if (sortOption === "invoiceStockDesc") return (b.invoiceStock || 0) - (a.invoiceStock || 0);
      if (sortOption === "reorderAlert") return ((a.reorderPoint || 0) - (a.realStock || 0)) - ((b.reorderPoint || 0) - (b.realStock || 0));
      if (sortOption === "updatedAtDesc") return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Danh mục sản phẩm</h1>
          <p className="text-zinc-500">Quản lý danh sách hàng hóa và tồn kho hiện tại.</p>
          {viewMode !== "all" && (
            <p className="mt-1 text-sm text-slate-600">
              Đang hiển thị: {viewMode === "low-stock" ? "Sản phẩm sắp hết" : "Cần đặt hàng"}.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end w-full lg:w-auto">
          <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={downloadTemplate}>
            <FileSpreadsheet className="h-4 w-4" /> Template Excel
          </Button>
          <div className="relative w-full sm:w-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImportExcel}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={importing}
            />
            <Button variant="outline" className="gap-2 w-full sm:w-auto" disabled={importing}>
              <Upload className="h-4 w-4" /> 
              {importing ? "Đang import..." : "Import Excel"}
            </Button>
          </div>
          <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => toast.success("Mô phỏng: Đã tải xuống file Excel")}>
            <DownloadCloud className="h-4 w-4" /> Xuất Excel
          </Button>
          <Button 
            className="gap-2 w-full sm:w-auto" 
            onClick={() => {
              setEditingItem(null);
              setImagePreview(null);
              setImageChanged(false);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Thêm sản phẩm
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Tìm kiếm theo tên hoặc mã SKU..." 
            className="w-full pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
          >
            <option value="">Tất cả nhà cung cấp</option>
            {suppliers.map((supplier) => (
              <option key={supplier} value={supplier}>{supplier}</option>
            ))}
          </select>
          <select
            className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="realStockDesc">Tồn thực tế giảm</option>
            <option value="realStockAsc">Tồn thực tế tăng</option>
            <option value="invoiceStockDesc">Tồn sổ sách giảm</option>
            <option value="reorderAlert">Theo cảnh báo đặt hàng</option>
            <option value="updatedAtDesc">Mới cập nhật</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {filteredItems.map((item) => (
          <Card key={item.id} className="group flex h-full flex-col overflow-hidden border-zinc-200/60 transition-all hover:border-zinc-300 hover:shadow-md">
            {item.imageUrl ? (
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-44 items-center justify-center bg-slate-100 text-slate-500">
                Ảnh minh họa chưa có
              </div>
            )}
            <CardContent className="p-5 flex flex-1 flex-col justify-between gap-4">
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-zinc-900 leading-tight break-words text-base">{item.name}</h3>
                        <p className="text-xs text-zinc-500 mt-1 break-words">{item.sku || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 flex-shrink-0">
                    <button 
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-md hover:bg-zinc-100 transition-colors"
                      onClick={() => {
                        setEditingItem(item);
                        setImagePreview(item.imageUrl || null);
                        setImageChanged(false);
                        setIsModalOpen(true);
                      }}
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

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-emerald-50 p-3 border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-medium mb-1">Thực tế</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-emerald-700 leading-none">{item.realStock}</span>
                      <span className="text-xs text-emerald-600/80">{item.unit || 'cái'}</span>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-blue-50 p-3 border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium mb-1">Sổ sách</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-blue-700 leading-none">{item.invoiceStock}</span>
                      <span className="text-xs text-blue-600/80">{item.unit || 'cái'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap gap-2">
                  {item.supplier && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">Nhà cung cấp: {item.supplier}</span>
                  )}
                  {item.location && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">Kho: {item.location}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.reorderPoint !== undefined && item.reorderPoint !== null && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">Tái đặt tại: {item.reorderPoint}</span>
                  )}
                  {(item.realStock || 0) <= (item.reorderPoint || 0) && (
                    <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-700">Cảnh báo: hàng sắp hết</span>
                  )}
                </div>
              </div>
              {item.category && (
                <div className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 w-fit">
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
                <div className="space-y-2">
                  <Label>Ảnh sản phẩm</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  />
                  {imagePreview ? (
                    <div className="relative mt-3 rounded-2xl overflow-hidden border border-zinc-200">
                      <img src={imagePreview} alt="Preview ảnh" className="h-40 w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm"
                        onClick={clearImage}
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-500">
                      Chưa có ảnh minh họa.
                    </div>
                  )}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Danh mục</Label>
                    <Input name="category" defaultValue={editingItem?.category} placeholder="VD: Điện tử" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nhà cung cấp</Label>
                    <Input name="supplier" defaultValue={editingItem?.supplier} placeholder="VD: Logitech" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tồn thực tế</Label>
                    <Input name="realStock" type="number" defaultValue={editingItem?.realStock || 0} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tồn sổ sách</Label>
                    <Input name="invoiceStock" type="number" defaultValue={editingItem?.invoiceStock || 0} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Điểm tái đặt hàng</Label>
                    <Input name="reorderPoint" type="number" defaultValue={editingItem?.reorderPoint || 0} placeholder="Số lượng cảnh báo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Vị trí kho</Label>
                    <Input name="location" defaultValue={editingItem?.location} placeholder="VD: Kho A, Kệ 3" />
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