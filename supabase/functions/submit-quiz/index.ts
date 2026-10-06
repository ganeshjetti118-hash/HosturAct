import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateJson, jsonHeaders, corsPreflightResponse } from '../_shared/gemini.ts';
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  try {
    const { participantId, answers = [] } = await req.json();
    const { data: participant } = await admin.from('participants').select('*').eq('id', participantId).single();
    if (!participant) throw new Error('Participant not found');
    const { data: quiz } = await admin.from('quizzes').select('*').eq('id', participant.quiz_id).single();
    if (!quiz) throw new Error('Activity not found');
    const answerFor = (index: number) => answers.find((answer: { itemIndex: number }) => answer.itemIndex === index)?.answer;
    let score = 0, correctCount = 0;
    const graded: Record<string, unknown>[] = [];
    for (let index = 0; index < quiz.questions.length; index++) {
      const item = quiz.questions[index];
      const answer = answerFor(index) ?? (quiz.type === 'quiz' ? -1 : '');
      let correct = quiz.type === 'quiz' ? answer === item.correctIndex : String(answer).trim().toLowerCase() === String(item.answer || '').trim().toLowerCase();
      if (!correct && ['guess_image', 'find_dsa'].includes(quiz.type) && String(answer).trim()) {
        const result = await generateJson(`Is "${answer}" an acceptable answer for "${item.answer}"? Reply only with JSON: {"correct":boolean}.`);
        correct = Boolean(result.correct);
      }
      const gained = correct ? Number(item.points || 1) : 0;
      score += gained; if (correct) correctCount++;
      graded.push({ itemIndex: index, answer, correct, expected: item.answer, score: gained });
    }
    const update = { score, correct_count: correctCount, total_questions: quiz.questions.length, answers: graded, completed: true, completed_at: new Date().toISOString() };
    const { error } = await admin.from('participants').update(update).eq('id', participantId);
    if (error) throw error;
    return Response.json({ score, correctCount, totalItems: quiz.questions.length, type: quiz.type }, { headers: jsonHeaders });
  } catch (error) {
    return Response.json({ error: error.message || 'Submission failed' }, { status: 500, headers: jsonHeaders });
  }
});
