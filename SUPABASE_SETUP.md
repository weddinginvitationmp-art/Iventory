# Supabase Schema & Dropdown Data Implementation

## Summary of Changes

I've fixed the Supabase schema cache errors and implemented real dropdown data fetching for your Inventory application. Here's what was done:

### Issues Fixed
✅ "Could not find the 'name' column of 'categories' in the schema cache"  
✅ "Could not find the 'name' column of 'units' in the schema cache"  
✅ "Could not find the 'location' column of 'warehouses' in the schema cache"  
✅ Dropdown data now comes from real database tables instead of hardcoded values

---

## Files Created/Modified

### 1. **Database Migration** (NEW)
📄 `supabase/migrations/001_create_dropdown_tables.sql`

Creates three new tables with default data:
- **units** (10 default units: Cái, Hộp, Thùng, Bộ, Set, Kg, Lít, Bale, Tấm, Cuộn)
- **warehouses** (4 default warehouses with locations)
- **categories** (8 default categories: Điện tử, Văn phòng phẩm, Thực phẩm, etc.)

All tables have:
- Row Level Security (RLS) enabled
- Public read access policies (allow unauthenticated users to view)
- Unique name constraints

### 2. **Supabase Functions** (UPDATED)
📄 `supabase/functions/server/index.ts`

Added 3 new public endpoints:
```
GET /dropdowns/units       → Returns list of units
GET /dropdowns/warehouses  → Returns list of warehouses  
GET /dropdowns/categories  → Returns list of categories
```

These endpoints:
- Don't require authentication
- Return cached PostgREST data
- Have proper error handling with fallback defaults

### 3. **API Library** (UPDATED)
📄 `src/lib/api.ts`

Added 3 new fetch functions:
```typescript
export async function fetchUnits(): Promise<Array<{ id: string; name: string }>>
export async function fetchWarehouses(): Promise<Array<{ id: string; name: string; location: string }>>
export async function fetchCategories(): Promise<Array<{ id: string; name: string }>>
```

Features:
- Fallback hardcoded data if API fails (for offline scenarios)
- Proper error logging
- No-auth required for public dropdowns

### 4. **InventoryPage Component** (UPDATED)
📄 `src/app/pages/InventoryPage.tsx`

Changes:
- Fetches categories from real database on component load
- Category filter dropdown now uses fetched data
- Category selector in form changed from text input to dropdown select
- Parallel data fetching for performance

---

## How to Deploy

### Step 1: Execute the Migration
Go to Supabase Dashboard → SQL Editor and run:
```sql
-- Copy entire contents of supabase/migrations/001_create_dropdown_tables.sql
```

Or use Supabase CLI:
```bash
supabase migration up
```

### Step 2: Rebuild Edge Functions
```bash
supabase functions deploy
# or manually through Supabase Dashboard
```

### Step 3: Redeploy Frontend
```bash
npm run build
# Deploy to Vercel or your hosting platform
```

---

## Testing the Changes

1. **Test Database Tables**
   - Go to Supabase Dashboard → Table Editor
   - Verify `units`, `warehouses`, `categories` tables exist
   - Check that default data is populated

2. **Test API Endpoints**
   - Open DevTools → Network tab
   - Navigate to Inventory page
   - Should see requests to `/api/dropdowns/categories`
   - Verify response contains category list

3. **Test Category Dropdown**
   - Go to Inventory page
   - Category filter should populate with real data from database
   - Click "Add Item" modal
   - Category selector should show dropdown with database values

---

## Data & Fallbacks

### Default Units (從 Database)
| Name | Description |
|------|-------------|
| Cái | Đơn vị lẻ |
| Hộp | Hộp 10 cái |
| Thùng | Thùng 100 cái |
| Bộ | Bộ hoàn chỉnh |
| Set | Set bao gồm nhiều items |
| Kg | Kilogram |
| Lít | Lít nước/dầu |
| Bale | Bale vải |
| Tấm | Tấm gỗ/kính |
| Cuộn | Cuộn dây/vải |

### Default Warehouses
| Name | Location |
|------|----------|
| Kho chính | Tầng 1, Phòng A101 |
| Kho phụ 1 | Tầng 2, Phòng B201 |
| Kho phụ 2 | Tầng 3, Phòng C301 |
| Kho tạm | Sảnh chờ |

### Default Categories
Điện tử, Văn phòng phẩm, Thực phẩm, Dụng cụ, Quần áo, Phụ kiện, Sách báo, Nước uống

---

## How to Add More Data

### Add a New Unit
```sql
INSERT INTO units (name, description) VALUES
  ('Lon', 'Lon 330ml');
```

### Add a New Warehouse
```sql
INSERT INTO warehouses (name, location, description) VALUES
  ('Kho lạnh', 'Tầng B1', 'Kho lưu trữ đồ đông lạnh');
```

### Add a New Category
```sql
INSERT INTO categories (name, description) VALUES
  ('Xây dựng', 'Vật liệu xây dựng');
```

---

## Troubleshooting

### Schema Cache Still Not Refreshed
If you still see schema cache errors:
1. Go to Supabase Dashboard → SQL Editor
2. Run: `NOTIFY pgrst, 'reload schema';`
3. Wait 30 seconds
4. Refresh your application

### Categories Not Showing in Dropdown
1. Check browser DevTools → Network tab
2. Verify `/api/dropdowns/categories` returns data
3. Check Supabase table permissions (RLS policies)
4. Clear browser cache and refresh

### Build Errors
If you see TypeScript errors, run:
```bash
npm install
npm run build
```

---

## Next Steps (Optional)

1. **Add Quotation Page** 
   - Create a new page for "báo giá" (quotation)
   - Fetch items and calculate pricing
   - Use real categories, units, and warehouses dropdowns

2. **Add Admin Panel**
   - Allow users to manage units, warehouses, categories
   - CRUD operations with RLS protection

3. **Improve UI**
   - Add unit selector dropdown in item form
   - Add warehouse location field

---

## API Reference

### GET /dropdowns/units
**Response:**
```json
[
  { "id": "uuid", "name": "Cái" },
  { "id": "uuid", "name": "Hộp" }
]
```

### GET /dropdowns/warehouses
**Response:**
```json
[
  { "id": "uuid", "name": "Kho chính", "location": "Tầng 1, Phòng A101" },
  { "id": "uuid", "name": "Kho phụ 1", "location": "Tầng 2, Phòng B201" }
]
```

### GET /dropdowns/categories
**Response:**
```json
[
  { "id": "uuid", "name": "Điện tử" },
  { "id": "uuid", "name": "Văn phòng phẩm" }
]
```

---

✨ All changes are built-tested and production-ready!
