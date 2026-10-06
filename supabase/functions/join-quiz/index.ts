import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonHeaders, corsPreflightResponse } from '../_shared/gemini.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cleanItem = (type: string, item: Record<string, unknown>) => {
  const common = { points: item.points, time_seconds: item.time_seconds ?? null };
  if (type === 'quiz') return { text: item.text, options: item.options, ...common };
  if (type === 'guess_image') return { image_url: item.image_url, hint: item.hint, ...common };
  if (type === 'find_dsa') return { scenario: item.scenario, ...common };
  return { statement: item.statement, starter_code: item.starter_code, language: item.language || 'javascript', ...common };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  const { joinCode, nickname } = await req.json();
  const code = String(joinCode || '').trim().toUpperCase();
  const name = String(nickname || '').trim();
  if (!code || !name) return Response.json({ error: 'Join code and nickname are required' }, { status: 400, headers: jsonHeaders });
  const { data: quiz } = await admin.from('quizzes').select('*').eq('join_code', code).maybeSingle();
  if (!quiz || quiz.status !== 'active') return Response.json({ error: 'This activity is not accepting participants.' }, { status: 404, headers: jsonHeaders });
  let { data: participant } = await admin.from('participants').select('*').eq('quiz_id', quiz.id).eq('nickname', name).eq('completed', false).maybeSingle();
  if (!participant) {
    const created = await admin.from('participants').insert({ quiz_id: quiz.id, nickname: name, total_questions: quiz.questions.length }).select().single();
    if (created.error) return Response.json({ error: created.error.message }, { status: 500, headers: jsonHeaders });
    participant = created.data;
  }
  return Response.json({ participantId: participant.id, quiz: { id: quiz.id, title: quiz.title, topic: quiz.topic, type: quiz.type, totalItems: quiz.questions.length, default_time_seconds: quiz.default_time_seconds, items: quiz.questions.map((item: Record<string, unknown>) => cleanItem(quiz.type, item)) } }, { headers: jsonHeaders });
});
