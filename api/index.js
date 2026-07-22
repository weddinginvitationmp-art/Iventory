export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    message: 'Vercel API proxy placeholder. Point this to your real backend or Supabase edge function.'
  })
}
