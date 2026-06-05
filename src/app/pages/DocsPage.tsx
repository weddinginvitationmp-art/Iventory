import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Package, LayoutDashboard, ArrowLeftRight, FileText } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl p-8 bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hướng dẫn sử dụng — Inventro</h1>
            <p className="mt-1 text-sm opacity-90">Tổng quan, tính năng và mẹo sử dụng hệ thống quản lý kho hàng.</p>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Giới thiệu</CardTitle>
            <CardDescription>Inventro là hệ thống quản lý kho đơn giản, tập trung vào nhập/xuất, theo dõi tồn kho và nhập dữ liệu từ file CSV/Excel.</CardDescription>
          </CardHeader>
          <CardContent>
            <section className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Tính năng chi tiết</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-900">Dashboard</h4>
                    <p className="mt-2 text-sm text-slate-700">Xem tổng số sản phẩm, tồn kho thực/tồn kho hóa đơn, đồ thị xu hướng và thông báo sản phẩm sắp hết.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-900">Kho hàng</h4>
                    <p className="mt-2 text-sm text-slate-700">Thêm, cập nhật hoặc xóa sản phẩm. Lưu trữ SKU, tên, danh mục, tồn kho thực, tồn kho hóa đơn và ghi chú.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-900">Giao dịch</h4>
                    <p className="mt-2 text-sm text-slate-700">Ghi nhận nhập/xuất, chọn sản phẩm, điều chỉnh số lượng và cập nhật tồn kho ngay lập tức.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-900">Import file</h4>
                    <p className="mt-2 text-sm text-slate-700">Import từ file CSV/Excel, khớp SKU để cập nhật hoặc thêm mới sản phẩm, và xem báo cáo lỗi nếu có.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Hướng dẫn nhanh</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
                  <li>Đăng nhập tại trang <strong>/auth</strong> với email và mật khẩu.</li>
                  <li>Truy cập <strong>Tổng quan</strong> để kiểm tra tình trạng kho và sản phẩm sắp cạn.</li>
                  <li>Vào <strong>Kho hàng</strong> để tạo, chỉnh sửa, hoặc xóa sản phẩm theo SKU.</li>
                  <li>Ghi nhận <strong>Giao dịch</strong> nhập/xuất để cập nhật tồn kho tự động.</li>
                  <li>Import dữ liệu qua file tại <strong>Kho hàng</strong> nếu cần tải danh sách lớn.
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Định nghĩa dữ liệu</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li><strong>SKU</strong>: Mã sản phẩm duy nhất, dùng để khớp khi import và lọc dữ liệu.</li>
                  <li><strong>realStock</strong>: Tồn kho thực tế hiện tại đang có trong kho.</li>
                  <li><strong>invoiceStock</strong>: Tồn kho theo hóa đơn hoặc nhập xuất sắp tới.</li>
                  <li><strong>type</strong>: Kiểu giao dịch gồm <code>in</code> (nhập) và <code>out</code> (xuất).</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Lưu ý khi sử dụng</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
                  <li>Luôn kiểm tra SKU trước khi import để tránh trùng lặp.</li>
                  <li>Nhập đủ thông tin bắt buộc như tên, SKU và số lượng.</li>
                  <li>Kiểm tra lại tồn kho sau khi ghi nhận giao dịch để tránh sai số.</li>
                  <li>Sử dụng báo cáo danh sách lỗi import để sửa dữ liệu nguồn.</li>
                </ul>
              </div>
            </section>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Phím tắt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4 text-sky-600"/> Dashboard: Tổng quan</div>
                <div className="flex items-center gap-2"><Package className="h-4 w-4 text-violet-600"/> Kho hàng: Quản lý sản phẩm</div>
                <div className="flex items-center gap-2"><ArrowLeftRight className="h-4 w-4 text-fuchsia-600"/> Giao dịch: Nhập / Xuất</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mẹo</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>- Sử dụng SKU rõ ràng để tránh trùng lặp khi import.</li>
                <li>- Kiểm tra file CSV trước khi import để giảm lỗi.</li>
                <li>- Sao lưu dữ liệu định kỳ nếu dùng production KV store.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Liên hệ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">Nếu cần trợ giúp, mở issue trên repo hoặc liên hệ nhóm phát triển.</div>
              <div className="mt-3"><Button className="w-full">Mở issue</Button></div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
