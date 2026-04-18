import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
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
    const txs = await kv.getByPrefix('tx:');
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
    const user = c.get('user');
    
    const newTx = {
      ...tx,
      id,
      userId: user.id,
      date: tx.date || new Date().toISOString()
    };
    
    // Update the corresponding item
    if (newTx.itemId) {
      const item = await kv.get(`item:${newTx.itemId}`);
      if (!item) {
        return c.json({ error: "Item not found" }, 404);
      }
      
      let newRealStock = item.realStock || 0;
      let newInvoiceStock = item.invoiceStock || 0;
      
      const multiplier = newTx.type === 'in' ? 1 : (newTx.type === 'out' ? -1 : 0);
      
      if (newTx.type === 'adjust') {
         if (newTx.stockType === 'real' || newTx.stockType === 'both') {
             newRealStock = newTx.quantity;
         }
         if (newTx.stockType === 'invoice' || newTx.stockType === 'both') {
             newInvoiceStock = newTx.quantity;
         }
      } else {
         if (newTx.stockType === 'real' || newTx.stockType === 'both') {
             newRealStock += (newTx.quantity * multiplier);
         }
         if (newTx.stockType === 'invoice' || newTx.stockType === 'both') {
             newInvoiceStock += (newTx.quantity * multiplier);
         }
      }
      
      item.realStock = newRealStock;
      item.invoiceStock = newInvoiceStock;
      item.updatedAt = new Date().toISOString();
      
      // Save both transaction and item atomically using mset
      await kv.mset([`tx:${id}`, `item:${item.id}`], [newTx, item]);
      return c.json({ transaction: newTx, item });
    } else {
      await kv.set(`tx:${id}`, newTx);
      return c.json({ transaction: newTx });
    }
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

    // Read file content
    const fileContent = await file.text();
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return c.json({ error: 'File must contain at least header and one data row' }, 400);
    }

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const expectedHeaders = ['name', 'sku', 'category', 'unit', 'realStock', 'invoiceStock'];
    
    // Check if headers match expected format
    const hasRequiredHeaders = expectedHeaders.every(header => headers.includes(header));
    if (!hasRequiredHeaders) {
      return c.json({ 
        error: `Invalid CSV format. Expected headers: ${expectedHeaders.join(', ')}` 
      }, 400);
    }

    const items = [];
    let imported = 0;
    let errors = [];

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        const itemData: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index];
          if (header === 'realStock' || header === 'invoiceStock') {
            itemData[header] = parseInt(value) || 0;
          } else {
            itemData[header] = value;
          }
        });

        // Validate required fields
        if (!itemData.name || !itemData.sku) {
          errors.push(`Row ${i + 1}: Missing required fields (name, sku)`);
          continue;
        }

        // Check if item already exists
        const existingItems = await kv.getByPrefix('item:');
        const existingItem = existingItems.find((item: any) => item.sku === itemData.sku);
        
        if (existingItem) {
          // Update existing item
          const updatedItem = {
            ...existingItem,
            ...itemData,
            updatedAt: new Date().toISOString()
          };
          await kv.set(`item:${existingItem.id}`, updatedItem);
        } else {
          // Create new item
          const id = crypto.randomUUID();
          const newItem = {
            ...itemData,
            id,
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
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${imported} items${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });

  } catch (err: any) {
    console.log('[import] Error:', err);
    return c.json({ error: 'Import failed: ' + err.message }, 500);
  }
});

Deno.serve(app.fetch);
