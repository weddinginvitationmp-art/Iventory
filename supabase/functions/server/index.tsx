import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Token'],
}));
app.use('*', logger(console.log));

console.log('[INIT] Starting edge function...');

// Hardcoded credentials for consistency
const HARDCODED_URL = 'https://hbfnznazboimbzlpcnkg.supabase.co';
const HARDCODED_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZm56bmF6Ym9pbWJ6bHBjbmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTQyNzMsImV4cCI6MjA5MjA3MDI3M30.6WN4uQXBXpHRGL8gJr4OyBYgxAEzG5sbW-1Q7JRLeRM';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || HARDCODED_URL;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || HARDCODED_ANON_KEY;

console.log('[INIT] SUPABASE_URL:', SUPABASE_URL);
console.log('[INIT] SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? `set (${SERVICE_ROLE_KEY.length} chars)` : 'NOT SET - using empty string');
console.log('[INIT] ANON_KEY:', ANON_KEY ? `set (${ANON_KEY.length} chars)` : 'NOT SET');

let supabaseAdmin: any;
try {
  supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  console.log('[INIT] supabaseAdmin client created successfully');
} catch (err: any) {
  console.error('[INIT] Failed to create supabaseAdmin client:', err);
}

function getUserClient() {
  return createClient(SUPABASE_URL, ANON_KEY);
}

function base64UrlDecode(base64Url: string) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return new TextDecoder().decode(
    Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
  );
}

const requireAuth = async (c: any, next: any) => {
  // Use X-User-Token header for actual user token, Authorization for anon key verification
  const userToken = c.req.header('X-User-Token');
  if (!userToken) {
    return c.json({ error: 'Missing user token' }, 401);
  }

  try {
    const parts = userToken.split('.');
    if (parts.length !== 3) {
      return c.json({ error: 'Invalid JWT format' }, 401);
    }

    const payload = JSON.parse(base64UrlDecode(parts[1]));
    c.set('user', {
      id: payload.sub || 'unknown',
      email: payload.email || 'unknown@example.com',
    });
  } catch (err) {
    console.log('[auth] Token decode error:', err);
    return c.json({ error: 'Failed to decode token' }, 401);
  }

  await next();
};

// Health check endpoint
app.get("/smooth-handler/health", (c) => {
  return c.json({ status: "ok" });
});

// Auth endpoints
app.post("/smooth-handler/auth/signup", async (c) => {
  try {
    console.log('[signup] SUPABASE_URL:', SUPABASE_URL ? 'set' : 'MISSING');
    console.log('[signup] SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? `set (length: ${SERVICE_ROLE_KEY.length})` : 'MISSING');
    console.log('[signup] ANON_KEY:', ANON_KEY ? `set (length: ${ANON_KEY.length})` : 'MISSING');

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.log('[signup] ERROR: Missing Supabase credentials');
      return c.json({ error: 'Server misconfiguration: missing Supabase service role credentials' }, 500);
    }

    const { email, password, name } = await c.req.json();
    console.log('[signup] Attempting to create user:', email);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true
    });

    if (error) {
      console.log('[signup] Supabase error:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log('[signup] User created successfully');
    return c.json({ user: data.user });
  } catch (err: any) {
    console.log('[signup] Exception:', err);
    return c.json({ error: 'Registration failed: ' + err.message }, 500);
  }
});

// Items API
app.get("/smooth-handler/items", requireAuth, async (c) => {
  try {
    const items = await kv.getByPrefix('item:');
    return c.json(items);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post("/smooth-handler/items", requireAuth, async (c) => {
  try {
    const item = await c.req.json();
    const id = item.id || crypto.randomUUID();
    const newItem = {
      ...item,
      id,
      createdAt: new Date().toISOString(),
      realStock: item.realStock || 0,
      invoiceStock: item.invoiceStock || 0
    };
    await kv.set(`item:${id}`, newItem);
    return c.json(newItem);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put("/smooth-handler/items/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const updateData = await c.req.json();
    const existing = await kv.get(`item:${id}`);
    if (!existing) return c.json({ error: "Item not found" }, 404);
    
    const updated = { ...existing, ...updateData, updatedAt: new Date().toISOString() };
    await kv.set(`item:${id}`, updated);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete("/smooth-handler/items/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`item:${id}`);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Transactions API
app.get("/smooth-handler/transactions", requireAuth, async (c) => {
  try {
    const txs = await kv.getByPrefix('transaction:');
    // Sort descending by date
    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return c.json(txs);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post("/smooth-handler/transactions", requireAuth, async (c) => {
  try {
    const tx = await c.req.json();
    const id = tx.id || crypto.randomUUID();

    const newTx = {
      id,
      item_id: tx.item_id,
      date: tx.date,
      type: tx.type, // "import" or "export"
      quantity: tx.quantity,
      unit_price: tx.unit_price || 0,
      vat: tx.vat || 0,
      total_amount: tx.total_amount || (tx.quantity * (tx.unit_price || 0) + (tx.vat || 0)),
      has_invoice: tx.has_invoice || false,
      created_at: new Date().toISOString()
    };

    await kv.set(`transaction:${id}`, newTx);
    return c.json(newTx);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put("/smooth-handler/transactions/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const updateData = await c.req.json();

    const existing = await kv.get(`transaction:${id}`);
    if (!existing) return c.json({ error: "Transaction not found" }, 404);

    const updated = {
      ...existing,
      ...updateData,
      total_amount: updateData.total_amount || (updateData.quantity * (updateData.unit_price || existing.unit_price) + (updateData.vat || existing.vat))
    };

    await kv.set(`transaction:${id}`, updated);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete("/smooth-handler/transactions/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`transaction:${id}`);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Get inventory summary (calculated from transactions)
app.get("/smooth-handler/inventory-summary", requireAuth, async (c) => {
  try {
    const items = await kv.getByPrefix('item:');
    const transactions = await kv.getByPrefix('transaction:');

    const summary = items.map((item: any) => {
      const itemTxs = transactions.filter((tx: any) => tx.item_id === item.id);

      const importTxs = itemTxs.filter((tx: any) => tx.type === 'import');
      const exportTxs = itemTxs.filter((tx: any) => tx.type === 'export');

      const totalImport = importTxs.reduce((sum: number, tx: any) => sum + tx.quantity, 0);
      const totalExport = exportTxs.reduce((sum: number, tx: any) => sum + tx.quantity, 0);
      const realStock = totalImport - totalExport;

      const invoiceTxs = itemTxs.filter((tx: any) => tx.has_invoice);
      const totalInvoiceImport = invoiceTxs.filter((tx: any) => tx.type === 'import').reduce((sum: number, tx: any) => sum + tx.quantity, 0);
      const totalInvoiceExport = invoiceTxs.filter((tx: any) => tx.type === 'export').reduce((sum: number, tx: any) => sum + tx.quantity, 0);
      const invoiceStock = totalInvoiceImport - totalInvoiceExport;

      const totalValue = itemTxs.reduce((sum: number, tx: any) => sum + tx.total_amount, 0);
      const avgPrice = totalImport > 0 ? totalValue / totalImport : 0;

      return {
        ...item,
        total_import: totalImport,
        total_export: totalExport,
        real_stock: realStock,
        invoice_stock: invoiceStock,
        avg_price: avgPrice,
        total_value: totalValue
      };
    });

    return c.json(summary);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Import items from Excel/CSV
app.post("/smooth-handler/import-items", requireAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400);
    }

    // Check file type - support both CSV and Excel
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!isCSV && !isExcel) {
      return c.json({ 
        error: 'Unsupported file format. Please upload a CSV or Excel file.\n\nSupported formats: .csv, .xlsx, .xls' 
      }, 400);
    }

    let rawData: any[] = [];

    if (isExcel) {
      // Parse Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    } else {
      // Parse CSV file
      const fileContent = await file.text();
      
      // Skip comment lines and filter empty lines
      const lines = fileContent
        .split('\n')
        .filter(line => !line.startsWith('#') && line.trim())
        .map(line => line.trim());
      
      if (lines.length < 2) {
        return c.json({ error: 'File must contain at least header and one data row' }, 400);
      }

      // Parse CSV with proper quoted field handling
      const parseCSVLine = (line: string): string[] => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      rawData = lines.map(line => parseCSVLine(line));
    }

    if (rawData.length < 2) {
      return c.json({ error: 'File must contain at least header and one data row' }, 400);
    }

    // Extract headers from first row
    const headerRow = rawData[0];
    const headers = headerRow.map((h: any) => String(h || '').toLowerCase().trim());

    const headerAliases: Record<string, string[]> = {
      name: ['name', 'tên hàng', 'mã hàng hóa', 'tên sản phẩm', 'tên hàng hóa'],
      sku: ['sku', 'mã hàng', 'mã sản phẩm', 'mã hàng hóa'],
      category: ['category', 'danh mục', 'phân loại', 'loại', 'thể loại'],
      unit: ['unit', 'đvt', 'đơn vị', 'đơn vị tính'],
      realstock: ['realstock', 'tồn thực tế', 'tồn', 'tồn kho', 'số lượng thực tế', 'khối lượng'],
      invoicestock: ['invoicestock', 'hóa đơn', 'số lượng hóa đơn', 'invoice stock'],
      price: ['price', 'đơn giá', 'giá', 'giá bán'],
      supplier: ['supplier', 'nhà cung cấp', 'supplier name']
    };

    const normalizeHeader = (header: string) => {
      for (const [standard, aliases] of Object.entries(headerAliases)) {
        if (aliases.includes(header)) {
          return standard;
        }
      }
      return null;
    };

    const normalizedHeaders = headers.map(normalizeHeader);
    const requiredFields = ['name', 'sku', 'category', 'unit', 'realstock', 'invoicestock'];
    const hasRequiredFields = requiredFields.every(field => normalizedHeaders.includes(field));

    if (!hasRequiredFields) {
      const readableAliases = requiredFields.map(field => `${field} (${headerAliases[field].join(' | ')})`).join(', ');
      return c.json({ 
        error: `Invalid file format. Required headers: ${readableAliases}\nFound: ${headers.join(', ')}`
      }, 400);
    }

    const items = [];
    let imported = 0;
    let errors = [];
    const skuSet = new Set<string>();
    const existingItems = await kv.getByPrefix('item:');
    const existingSkus = new Set(existingItems.map((item: any) => item.sku));

    // Process each data row
    for (let i = 1; i < rawData.length; i++) {
      try {
        const values = rawData[i];
        const itemData: any = {};
        
        // Map values to normalized headers
        normalizedHeaders.forEach((normalizedHeader, index) => {
          const value = String(values[index] || '').trim();
          if (!normalizedHeader) {
            return;
          }

          if (normalizedHeader === 'realstock' || normalizedHeader === 'invoicestock') {
            const parsed = parseInt(value);
            itemData[normalizedHeader === 'realstock' ? 'realStock' : 'invoiceStock'] = !isNaN(parsed) && parsed >= 0 ? parsed : 0;
          } else if (normalizedHeader === 'price') {
            const parsed = parseFloat(value);
            itemData.price = !isNaN(parsed) && parsed >= 0 ? parsed : 0;
          } else if (normalizedHeader === 'name') {
            itemData.Name = value;
          } else if (normalizedHeader === 'sku') {
            itemData.Sku = value;
          } else if (normalizedHeader === 'category') {
            itemData.Category = value;
          } else if (normalizedHeader === 'unit') {
            itemData.Unit = value;
          } else if (normalizedHeader === 'supplier') {
            itemData.Supplier = value;
          }
        });

        // Validate required fields
        if (!itemData.Name || !itemData.Sku) {
          errors.push(`Row ${i + 1}: Missing required fields (name or sku)`);
          continue;
        }

        // Validate field lengths
        if (itemData.Name.length > 255) {
          errors.push(`Row ${i + 1}: Product name too long (max 255 characters)`);
          continue;
        }
        if (itemData.Sku.length > 100) {
          errors.push(`Row ${i + 1}: SKU too long (max 100 characters)`);
          continue;
        }

        // Check for duplicate SKU in file
        if (skuSet.has(itemData.Sku)) {
          errors.push(`Row ${i + 1}: Duplicate SKU '${itemData.Sku}' in file`);
          continue;
        }
        skuSet.add(itemData.Sku);

        // Check if item already exists in database
        const existingItem = existingItems.find((item: any) => item.sku === itemData.Sku);
        
        if (existingItem) {
          // Update existing item
          const updatedItem = {
            ...existingItem,
            name: itemData.Name,
            category: itemData.Category || existingItem.category,
            unit: itemData.Unit || existingItem.unit,
            realStock: itemData.realStock !== undefined ? itemData.realStock : existingItem.realStock,
            invoiceStock: itemData.invoiceStock !== undefined ? itemData.invoiceStock : existingItem.invoiceStock,
            price: itemData.price !== undefined ? itemData.price : existingItem.price,
            supplier: itemData.Supplier || existingItem.supplier,
            updatedAt: new Date().toISOString()
          };
          await kv.set(`item:${existingItem.id}`, updatedItem);
        } else {
          // Create new item
          const id = crypto.randomUUID();
          const newItem = {
            id,
            name: itemData.Name,
            sku: itemData.Sku,
            category: itemData.Category || 'Chưa phân loại',
            unit: itemData.Unit || 'Cái',
            realStock: itemData.realStock || 0,
            invoiceStock: itemData.invoiceStock || 0,
            price: itemData.price || 0,
            supplier: itemData.Supplier || '',
            createdAt: new Date().toISOString()
          };
          await kv.set(`item:${id}`, newItem);
        }
        
        imported++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return c.json({ 
      imported,
      total: rawData.length - 1,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${imported} items out of ${rawData.length - 1}${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });

  } catch (err: any) {
    console.log('[import] Error:', err);
    return c.json({ error: 'Import failed: ' + err.message }, 500);
  }
});

// Import transactions from Excel (monthly format)
app.post("/smooth-handler/import-excel", requireAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const month = formData.get('month') as string; // Format: YYYY-MM

    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400);
    }

    if (!month) {
      return c.json({ error: 'Month is required (YYYY-MM format)' }, 400);
    }

    // Parse Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    const rawData = jsonData.map((row: any) =>
      Array.isArray(row) ? row.map(cell => String(cell || '').trim()) : []
    );

    if (rawData.length < 2) {
      return c.json({ error: 'File must contain at least header and one data row' }, 400);
    }

    // Parse headers to identify day columns
    const headerRow = rawData[0];
    const headers = headerRow.map((h: any) => String(h || '').toLowerCase().trim());

    // Find item columns and day columns
    const itemColumns = ['mã hàng', 'tên hàng', 'đvt'];
    const dayColumns: { day: number, quantityCol: number, priceCol: number, vatCol: number, totalCol: number, invoiceCol: number }[] = [];

    headers.forEach((header, index) => {
      // Look for patterns like "Ngày 1", "1/quantity", "1/price", etc.
      const dayMatch = header.match(/^ngày\s*(\d+)$/i) || header.match(/^(\d+)\//);
      if (dayMatch) {
        const day = parseInt(dayMatch[1]);
        if (day >= 1 && day <= 31) {
          // Find related columns for this day
          const baseIndex = Math.floor(index / 5) * 5; // Assume 5 columns per day
          dayColumns.push({
            day,
            quantityCol: baseIndex,
            priceCol: baseIndex + 1,
            vatCol: baseIndex + 2,
            totalCol: baseIndex + 3,
            invoiceCol: baseIndex + 4
          });
        }
      }
    });

    const transactions = [];
    let imported = 0;
    let errors = [];

    // Process each data row
    for (let i = 1; i < rawData.length; i++) {
      try {
        const values = rawData[i];

        // Extract item info
        const itemCode = String(values[headers.indexOf('mã hàng')] || '').trim();
        const itemName = String(values[headers.indexOf('tên hàng')] || '').trim();
        const unit = String(values[headers.indexOf('đvt')] || '').trim();

        if (!itemCode || !itemName) {
          errors.push(`Row ${i + 1}: Missing item code or name`);
          continue;
        }

        // Find or create item
        let item = null;
        const existingItems = await kv.getByPrefix('item:');
        item = existingItems.find((it: any) => it.code === itemCode);

        if (!item) {
          const itemId = crypto.randomUUID();
          item = {
            id: itemId,
            code: itemCode,
            name: itemName,
            unit: unit,
            warehouse_name: 'Main Warehouse',
            created_at: new Date().toISOString()
          };
          await kv.set(`item:${itemId}`, item);
        }

        // Process each day
        for (const dayCol of dayColumns) {
          const quantity = parseFloat(values[dayCol.quantityCol] || '0');
          const unitPrice = parseFloat(values[dayCol.priceCol] || '0');
          const vat = parseFloat(values[dayCol.vatCol] || '0');
          const totalAmount = parseFloat(values[dayCol.totalCol] || '0');
          const hasInvoice = String(values[dayCol.invoiceCol] || '').toLowerCase().includes('có');

          if (quantity > 0) {
            // Determine type based on quantity (positive = import, negative = export)
            const type = quantity > 0 ? 'import' : 'export';
            const absQuantity = Math.abs(quantity);

            const transaction = {
              id: crypto.randomUUID(),
              item_id: item.id,
              date: `${month}-${String(dayCol.day).padStart(2, '0')}`,
              type,
              quantity: absQuantity,
              unit_price: unitPrice,
              vat,
              total_amount: totalAmount || (absQuantity * unitPrice + vat),
              has_invoice: hasInvoice,
              created_at: new Date().toISOString()
            };

            await kv.set(`transaction:${transaction.id}`, transaction);
            transactions.push(transaction);
            imported++;
          }
        }

      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return c.json({
      imported,
      total: transactions.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${imported} transactions`
    });

  } catch (err: any) {
    console.log('[import-excel] Error:', err);
    return c.json({ error: 'Import failed: ' + err.message }, 500);
  }
});

Deno.serve(app.fetch);
