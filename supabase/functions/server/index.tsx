import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: ["https://iventory-fawn.vercel.app", "http://localhost:5174"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Missing Authorization header' }, 401);
  }
  const token = authHeader.split(' ')[1];
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || ''
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return c.json({ error: 'Unauthorized: ' + (error?.message || 'Invalid token') }, 401);
  }
  
  c.set('user', user);
  await next();
};

// Health check endpoint
app.get("/make-server-e379089b/health", (c) => {
  return c.json({ status: "ok" });
});

// Auth endpoints
app.post("/make-server-e379089b/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true
    });

    if (error) throw error;
    return c.json({ user: data.user });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// Items API
app.get("/make-server-e379089b/items", requireAuth, async (c) => {
  try {
    const items = await kv.getByPrefix('item:');
    return c.json(items);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post("/make-server-e379089b/items", requireAuth, async (c) => {
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

app.put("/make-server-e379089b/items/:id", requireAuth, async (c) => {
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

app.delete("/make-server-e379089b/items/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`item:${id}`);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Transactions API
app.get("/make-server-e379089b/transactions", requireAuth, async (c) => {
  try {
    const txs = await kv.getByPrefix('tx:');
    // Sort descending by date
    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return c.json(txs);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post("/make-server-e379089b/transactions", requireAuth, async (c) => {
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

Deno.serve(app.fetch);
