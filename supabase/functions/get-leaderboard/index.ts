import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonHeaders, corsPreflightResponse } from '../_shared/gemini.ts';
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  const { quizId } = await req.json();
  const [{ data: quiz }, { data: rows, error }] = await Promise.all([
    admin.from('quizzes').select('id,title,topic,description,type,status,join_code,questions').eq('id', quizId).maybeSingle(),
    admin.from('participants').select('id,nickname,score,correct_count,total_questions,completed,completed_at').eq('quiz_id', quizId).order('score', { ascending: false }),
  ]);
  if (!quiz) return Response.json({ error: 'Activity not found' }, { status: 404, headers: jsonHeaders });
  if (error) return Response.json({ error: error.message }, { status: 500, headers: jsonHeaders });
  const participants = (rows || []).map((p) => ({ id: p.id, nickname: p.nickname, score: p.score, correctCount: p.correct_count, totalQuestions: p.total_questions, completed: p.completed, completedAt: p.completed_at }));
  return Response.json({ quiz: { ...quiz, joinCode: quiz.join_code, totalQuestions: quiz.questions.length }, participants, activeCount: participants.filter((p) => !p.completed).length, completedCount: participants.filter((p) => p.completed).length }, { headers: jsonHeaders });
});
