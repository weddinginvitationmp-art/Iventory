# Fullstack Inventory Management App

This is a code bundle for Fullstack Inventory Management App. The original project is available at https://www.figma.com/design/tlADekusXtDKBAIOjLkDx8/Fullstack-Inventory-Management-App.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Environment configuration

Create a `.env` file based on [.env.example](.env.example):

```bash
cp .env.example .env
```

Then fill in the values:
- `VITE_API_BASE_URL=/api` for local development
- `VITE_API_PROXY_TARGET=http://127.0.0.1:54321` if you want Vite to proxy requests to your local edge function backend
- `VITE_SUPABASE_URL=https://your-project.supabase.co`
- `VITE_SUPABASE_ANON_KEY=your-anon-key`

For production, set `VITE_API_BASE_URL` to your own API domain such as `https://api.yourdomain.com/api`.
