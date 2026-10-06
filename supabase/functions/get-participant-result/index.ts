import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonHeaders, corsPreflightResponse } from '../_shared/gemini.ts';
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  const { participantId } = await req.json();
  const { data: participant, error } = await admin.from('participants').select('*').eq('id', participantId).maybeSingle();
  if (error || !participant) return Response.json({ error: 'Result not found' }, { status: 404, headers: jsonHeaders });
  const [{ data: quiz }, { data: rows }] = await Promise.all([
    admin.from('quizzes').select('*').eq('id', participant.quiz_id).single(),
    admin.from('participants').select('id,nickname,score,correct_count,total_questions,completed,completed_at').eq('quiz_id', participant.quiz_id).order('score', { ascending: false }),
  ]);
  const participants = (rows || []).map((p) => ({ id: p.id, nickname: p.nickname, score: p.score, correctCount: p.correct_count, totalQuestions: p.total_questions, completed: p.completed, completedAt: p.completed_at }));
  return Response.json({ participant, quiz, participants }, { headers: jsonHeaders });
});
