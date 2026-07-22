import {
  BookOpen, Package, ArrowLeftRight, LayoutDashboard,
  AlertTriangle, CheckCircle, Info, TrendingDown, TrendingUp,
  Circle, Zap, HelpCircle,
} from 'lucide-react'
import { cn } from '../lib/utils'

const SECTIONS = [
  {
    id: 'overview',
    icon: LayoutDashboard,
    title: 'Tổng quan',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    content: [
      {
        type: 'text',
        text: 'Iventory là ứng dụng quản lý kho hàng full-stack, giúp bạn theo dõi tồn kho thực tế và sổ sách, ghi nhận giao dịch và phân tích dữ liệu qua biểu đồ trực quan.',
      },
      {
        type: 'features',
        items: [
          { icon: LayoutDashboard, label: 'Dashboard', desc: 'KPI, biểu đồ nhập/xuất, trạng thái tồn kho theo thời gian thực' },
          { icon: Package, label: 'Kho hàng', desc: 'Thêm, sửa, xóa mặt hàng với bộ lọc đa chiều và xuất CSV' },
          { icon: ArrowLeftRight, label: 'Giao dịch', desc: 'Ghi nhận 5 loại giao dịch, lọc theo ngày và loại' },
          { icon: AlertTriangle, label: 'Cảnh báo', desc: 'Tự động phát hiện hàng sắp hết và hết hàng' },
        ],
      },
    ],
  },
  {
    id: 'inventory',
    icon: Package,
    title: 'Kho hàng',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    content: [
      {
        type: 'text',
        text: 'Trang Kho hàng hiển thị toàn bộ mặt hàng dưới dạng card grid hoặc bảng. Mỗi mặt hàng có đầy đủ tồn kho, giá cả, danh mục và nhà cung cấp.',
      },
      {
        type: 'status-list',
        title: 'Trạng thái tồn kho:',
        items: [
          { color: 'bg-emerald-500', label: 'Đủ hàng', desc: 'Tồn kho thực > Ngưỡng đặt hàng' },
          { color: 'bg-amber-500', label: 'Sắp hết', desc: 'Tồn kho thực ≤ Ngưỡng đặt hàng (nhưng > 0)' },
          { color: 'bg-red-500', label: 'Hết hàng', desc: 'Tồn kho thực = 0' },
        ],
      },
      {
        type: 'note',
        text: 'Ngưỡng đặt hàng (reorder point) là mức tồn kho tối thiểu mà bạn muốn hệ thống cảnh báo để chuẩn bị đặt thêm hàng.',
      },
      {
        type: 'two-col',
        title: 'Tồn kho thực vs Sổ sách:',
        left: { label: 'Tồn kho thực', desc: 'Số lượng hàng thực tế có trong kho, được kiểm đếm trực tiếp.' },
        right: { label: 'Sổ sách', desc: 'Số lượng theo hóa đơn và chứng từ kế toán. Có thể lệch với thực tế.' },
      },
    ],
  },
  {
    id: 'transactions',
    icon: ArrowLeftRight,
    title: 'Giao dịch',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    content: [
      {
        type: 'text',
        text: 'Giao dịch ghi lại mọi sự thay đổi tồn kho. Mỗi giao dịch có thể ảnh hưởng đến kho thực, sổ sách, hoặc cả hai.',
      },
      {
        type: 'table',
        headers: ['Loại', 'Mô tả', 'Ảnh hưởng SL'],
        rows: [
          ['Nhập kho', 'Hàng về từ nhà cung cấp', '+SL'],
          ['Xuất kho', 'Hàng ra cho khách hoặc phòng ban', '−SL'],
          ['Điều chỉnh', 'Cân bằng sau kiểm kê thực tế', '+/− SL'],
          ['Chuyển kho', 'Di chuyển giữa các kho', 'Chuyển SL'],
          ['Hoàn trả', 'Khách trả lại hàng', '+SL'],
        ],
      },
      {
        type: 'note',
        text: 'Trường Ghi chú là bắt buộc khi ghi giao dịch — giúp truy vết lý do thay đổi tồn kho về sau.',
      },
    ],
  },
  {
    id: 'shortcuts',
    icon: Zap,
    title: 'Phím tắt & Tính năng',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    content: [
      {
        type: 'shortcuts',
        items: [
          { key: 'Ctrl + K', desc: 'Mở Command Palette — tìm kiếm nhanh trang và mặt hàng' },
          { key: 'Esc', desc: 'Đóng modal, palette, hoặc panel thông báo' },
          { key: '↑ ↓ Enter', desc: 'Điều hướng trong Command Palette' },
        ],
      },
      {
        type: 'list',
        title: 'Tính năng nổi bật:',
        items: [
          'Xuất CSV toàn bộ kho hàng từ nút "Xuất CSV" trên trang Kho hàng',
          'Chọn nhiều mặt hàng và xóa hàng loạt bằng hover → checkbox',
          'Toggle Grid / Table view trên trang Kho hàng',
          'Lọc giao dịch theo khoảng thời gian và loại giao dịch',
          'Thông báo tự động khi hàng sắp hết, click để xem chi tiết',
        ],
      },
    ],
  },
  {
    id: 'tips',
    icon: CheckCircle,
    title: 'Thực hành tốt',
    color: 'text-slate-500',
    bg: 'bg-slate-100',
    content: [
      {
        type: 'list',
        title: '',
        items: [
          'Đặt ngưỡng đặt hàng phù hợp với thời gian giao hàng của nhà cung cấp',
          'Ghi chú rõ ràng cho mỗi giao dịch để dễ kiểm tra về sau',
          'Kiểm kê định kỳ, dùng giao dịch "Điều chỉnh" để cân bằng sổ sách',
          'Dùng bộ lọc "Sắp hết" để nhanh chóng xác định hàng cần đặt thêm',
          'Theo dõi biểu đồ nhập/xuất để phát hiện xu hướng tiêu thụ theo tháng',
        ],
      },
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 pb-2">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <BookOpen size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hướng dẫn sử dụng</h1>
          <p className="text-slate-500 text-sm mt-0.5">Tài liệu tham khảo đầy đủ cho Iventory</p>
        </div>
      </div>

      {SECTIONS.map(section => {
        const Icon = section.icon
        return (
          <div key={section.id} className="bg-white rounded-2xl border border-[#e4e7ef] overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', section.bg)}>
                <Icon size={16} className={section.color} />
              </div>
              <h2 className="font-semibold text-slate-900">{section.title}</h2>
            </div>

            <div className="px-6 py-5 space-y-5">
              {section.content.map((block, i) => {
                if (block.type === 'text') {
                  return <p key={i} className="text-sm text-slate-600 leading-relaxed">{block.text}</p>
                }

                if (block.type === 'features') {
                  return (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {block.items!.map((item: any) => {
                        const FIcon = item.icon
                        return (
                          <div key={item.label} className="flex gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200 shadow-sm">
                              <FIcon size={15} className="text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                }

                if (block.type === 'status-list') {
                  return (
                    <div key={i}>
                      {block.title && <p className="text-sm font-semibold text-slate-800 mb-3">{block.title}</p>}
                      <div className="space-y-2">
                        {block.items!.map((item: any) => (
                          <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', item.color)} />
                            <span className="text-sm font-medium text-slate-800 w-20">{item.label}</span>
                            <span className="text-sm text-slate-500">{item.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }

                if (block.type === 'list') {
                  return (
                    <div key={i}>
                      {block.title && <p className="text-sm font-semibold text-slate-800 mb-2">{block.title}</p>}
                      <ul className="space-y-2">
                        {block.items!.map((item: string, j: number) => (
                          <li key={j} className="flex items-start gap-2.5 text-sm text-slate-600">
                            <span className="mt-2 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                }

                if (block.type === 'shortcuts') {
                  return (
                    <div key={i} className="space-y-2">
                      {block.items!.map((item: any) => (
                        <div key={item.key} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                          <kbd className="bg-white border border-slate-200 text-slate-700 text-xs font-mono px-2.5 py-1.5 rounded-lg shadow-sm whitespace-nowrap flex-shrink-0">{item.key}</kbd>
                          <span className="text-sm text-slate-600">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  )
                }

                if (block.type === 'two-col') {
                  return (
                    <div key={i}>
                      {block.title && <p className="text-sm font-semibold text-slate-800 mb-3">{block.title}</p>}
                      <div className="grid grid-cols-2 gap-3">
                        {[block.left, block.right].map((col: any) => (
                          <div key={col.label} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-sm font-semibold text-slate-800 mb-1">{col.label}</p>
                            <p className="text-xs text-slate-500 leading-relaxed">{col.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }

                if (block.type === 'note') {
                  return (
                    <div key={i} className="flex gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                      <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-700 leading-relaxed">{block.text}</p>
                    </div>
                  )
                }

                if (block.type === 'table') {
                  return (
                    <div key={i} className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-left border-b border-slate-100">
                            {block.headers!.map((h: string) => (
                              <th key={h} className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {block.rows!.map((row: string[], j: number) => (
                            <tr key={j} className="border-t border-slate-100 hover:bg-slate-50/50">
                              {row.map((cell, k) => (
                                <td key={k} className={cn('px-4 py-3 text-slate-600', k === 0 && 'font-medium text-slate-800')}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                }

                return null
              })}
            </div>
          </div>
        )
      })}

      {/* Support */}
      <div className="flex gap-3.5 p-5 bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-200 rounded-2xl">
        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <HelpCircle size={17} className="text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900 mb-1">Cần hỗ trợ thêm?</p>
          <p className="text-sm text-blue-700">
            Mở issue tại{' '}
            <span className="font-mono text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded text-xs">weddinginvitationmp-art/Iventory</span>
            {' '}trên GitHub.
          </p>
        </div>
      </div>
    </div>
  )
}
