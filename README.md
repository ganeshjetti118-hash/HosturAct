# HosturAct

HosturAct is a Vite + React application backed by Supabase. It has no proprietary application runtime dependency and can be deployed to Vercel, Netlify, or any static host.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`. Do not put a Gemini key in a browser-visible `VITE_` variable.

## Supabase setup

1. Create a Supabase project and run `supabase/migrations/20261004000000_initial_schema.sql` in its SQL editor (or use `supabase db push`).
2. In Supabase Auth, enable Email and, if used, Google. Add your local and deployed URLs to the redirect allow-list.
3. Set `GEMINI_API_KEY` as an Edge Function secret:

```bash
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
supabase functions deploy join-quiz
supabase functions deploy get-leaderboard
supabase functions deploy get-participant-result
supabase functions deploy submit-quiz
supabase functions deploy generate-activity
supabase functions deploy extract-csv-questions
supabase functions deploy run-activity-code
```

The code-run function uses model-based grading and deliberately never evaluates untrusted JavaScript. For deterministic execution, swap that adapter for an isolated runner such as Judge0, Piston, or E2B; never use `eval` in an Edge Function.

## Deployment

For Vercel or Netlify, use `npm run build` and publish `dist`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment-variable dashboard, then configure SPA history fallback to `index.html`.
