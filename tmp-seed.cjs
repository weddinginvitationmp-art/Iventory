const { createClient } = require('@supabase/supabase-js');
const url = 'https://hbfnznazboimbzlpcnkg.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZm56bmF6Ym9pbWJ6bHBjbmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTQyNzMsImV4cCI6MjA5MjA3MDI3M30.6WN4uQXBXpHRGL8gJr4OyBYgxAEzG5sbW-1Q7JRLeRM';
const supabase = createClient(url, key);

(async () => {
  const items = [
    { key: 'item:1', value: { id: '1', name: 'Laptop Dell Inspiron 15', sku: 'DELL-15', category: 'Laptop', supplier: 'FPT', location: 'A1', realStock: 12, invoiceStock: 15, reorderPoint: 5, costPrice: 18000000, sellPrice: 22000000, createdAt: new Date().toISOString() } },
    { key: 'item:2', value: { id: '2', name: 'Chuột Logitech MX', sku: 'LOG-001', category: 'Peripherals', supplier: 'Phúc Long', location: 'B2', realStock: 40, invoiceStock: 45, reorderPoint: 10, costPrice: 650000, sellPrice: 900000, createdAt: new Date().toISOString() } },
    { key: 'item:3', value: { id: '3', name: 'Máy in Canon 2900', sku: 'CAN-2900', category: 'Office', supplier: 'Canon VN', location: 'C3', realStock: 8, invoiceStock: 10, reorderPoint: 3, costPrice: 3200000, sellPrice: 4200000, createdAt: new Date().toISOString() } },
  ];
  const transactions = [
    { key: 'transaction:1', value: { id: '1', itemId: '1', itemName: 'Laptop Dell Inspiron 15', quantity: 2, stockTarget: 'in', note: 'Nhập kho tháng 7', createdAt: new Date().toISOString(), createdBy: 'Admin' } },
    { key: 'transaction:2', value: { id: '2', itemId: '2', itemName: 'Chuột Logitech MX', quantity: 5, stockTarget: 'out', note: 'Xuất cho phòng IT', createdAt: new Date().toISOString(), createdBy: 'Admin' } },
  ];

  const { error: itemError } = await supabase.from('kv_store_e379089b').upsert(items);
  if (itemError) throw itemError;
  const { error: txError } = await supabase.from('kv_store_e379089b').upsert(transactions);
  if (txError) throw txError;

  console.log('Inserted sample data successfully');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
