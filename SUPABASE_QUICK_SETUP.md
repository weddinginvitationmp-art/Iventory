# Quick Setup Guide

## For báo giá (Quotation) Feature

To implement the quotation page with real dropdown data:

```typescript
import { fetchCategories, fetchUnits, fetchWarehouses } from '@/lib/api'

export default function QuotationPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])

  useEffect(() => {
    const loadDropdowns = async () => {
      const [cat, unit, wh] = await Promise.all([
        fetchCategories(),
        fetchUnits(),
        fetchWarehouses(),
      ])
      setCategories(cat)
      setUnits(unit)
      setWarehouses(wh)
    }
    loadDropdowns()
  }, [])

  // Your quotation form now has real data from database
  return (
    <select>
      {categories.map(c => (
        <option key={c.id} value={c.name}>{c.name}</option>
      ))}
    </select>
  )
}
```

## Files to Apply SQL Migration

Choose one method:

### Method 1: Supabase Dashboard (Easiest)
1. Go to https://app.supabase.com
2. Select your project
3. Go to SQL Editor
4. Click "New Query"
5. Copy entire contents of `supabase/migrations/001_create_dropdown_tables.sql`
6. Click "Run" button
7. Done! ✅

### Method 2: Supabase CLI
```bash
cd d:\Linh\ tinh\Iventory
supabase migration up
supabase functions deploy
```

### Method 3: psql (if you have direct DB access)
```bash
psql "postgresql://user:password@host/dbname" < supabase/migrations/001_create_dropdown_tables.sql
```

---

## After Setup

### Verify Everything Works
```bash
npm run build  # Should complete without errors
npm run dev    # Open app and test
```

### Test in Browser
1. Open DevTools (F12)
2. Go to Network tab
3. Navigate to Inventory page
4. Look for `dropdowns/categories` request
5. Response should show category list

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Categories dropdown empty | Run SQL migration from SUPABASE_SETUP.md |
| "Schema cache" errors | Go to SQL Editor, run `NOTIFY pgrst, 'reload schema';` |
| Build fails | Run `npm install && npm run build` |
| API returns 400 error | Check browser console for details, verify RLS policies |

---

## File Summary

| File | Purpose |
|------|---------|
| `supabase/migrations/001_create_dropdown_tables.sql` | Database schema (RUN THIS FIRST) |
| `supabase/functions/server/index.ts` | API endpoints for dropdowns |
| `src/lib/api.ts` | Frontend API client functions |
| `src/app/pages/InventoryPage.tsx` | Updated to use real dropdown data |
| `SUPABASE_SETUP.md` | Full documentation |
| `SUPABASE_QUICK_SETUP.md` | This file |

---

## Ready to implement báo giá page?

All dropdown data is now coming from real Supabase tables:
- ✅ Units (`fetchUnits()`)
- ✅ Warehouses (`fetchWarehouses()`)
- ✅ Categories (`fetchCategories()`)

No more hardcoded mock data needed!
