import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonHeaders, corsPreflightResponse } from '../_shared/gemini.ts';
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  const { filePath } = await req.json();
  const { data, error } = await admin.storage.from('activity-files').download(filePath);
  if (error) return Response.json({ error: error.message }, { status: 400, headers: jsonHeaders });
  const [header, ...lines] = (await data.text()).trim().split(/\r?\n/);
  const keys = header.split(',').map((key) => key.trim());
  const questions = lines.filter(Boolean).map((line) => {
    const row = Object.fromEntries(line.split(',').map((value, index) => [keys[index], value.trim()]));
    return { text: row.text, options: [row.option1, row.option2, row.option3, row.option4], correctIndex: Math.max(0, Number(row.correctIndex || 1) - 1), points: Number(row.points || 1) };
  });
  return Response.json({ questions }, { headers: jsonHeaders });
});
