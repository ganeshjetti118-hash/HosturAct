import { supabase } from '@/lib/supabaseClient';

async function unwrap(result) {
  const resolved = await result;
  if (resolved.error) throw resolved.error;
  return resolved.data;
}

export const listActivities = () =>
  unwrap(supabase.from('quizzes').select('*').order('updated_at', { ascending: false }).limit(100));

export const listActiveActivities = () =>
  unwrap(supabase.from('quizzes').select('*').eq('status', 'active').order('updated_at', { ascending: false }).limit(20));

export const getActivity = (id) =>
  unwrap(supabase.from('quizzes').select('*').eq('id', id).single());

export const saveActivity = (id, values) => {
  const clean = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
  return id
    ? unwrap(supabase.from('quizzes').update(clean).eq('id', id).select().single())
    : unwrap(supabase.from('quizzes').insert(clean).select().single());
};

export const deleteActivity = async (id) => {
  await unwrap(supabase.from('participants').delete().eq('quiz_id', id));
  return unwrap(supabase.from('quizzes').delete().eq('id', id));
};

export const getParticipant = (id) =>
  unwrap(supabase.from('participants').select('*').eq('id', id).single());

export const callAction = async (name, payload) => {
  const { data, error } = await supabase.functions.invoke(name, { body: payload });
  if (error) {
    // Supabase wraps non-2xx Edge Function responses in a generic error. Read
    // the JSON error body so the UI can show the actionable server/AI cause.
    const details = await error.context?.json?.().catch(() => null);
    throw new Error(details?.error || error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
};

export const getLeaderboard = (quizId) => callAction('get-leaderboard', { quizId });
export const getParticipantResult = (participantId) => callAction('get-participant-result', { participantId });
