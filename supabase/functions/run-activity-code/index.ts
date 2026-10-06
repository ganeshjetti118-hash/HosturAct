import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateJson, jsonHeaders, corsPreflightResponse } from '../_shared/gemini.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// This deliberately grades code with the model, just as the previous server
// integration did; no untrusted JavaScript is evaluated in the Edge runtime.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  try {
    const { activityId, itemIndex, code } = await req.json();
    const { data: quiz } = await admin.from('quizzes').select('questions').eq('id', activityId).single();
    const item = quiz?.questions?.[itemIndex];
    if (!item) throw new Error('Problem not found');
    const result = await generateJson(`Assess this JavaScript solution against the supplied test cases. Do not execute it. Return only JSON: {"passedCount":number,"totalCount":number,"results":[{"passed":boolean,"error":string?}]}.\nStatement: ${item.statement}\nTests: ${JSON.stringify(item.test_cases || [])}\nReference solution: ${item.solution}\nSubmitted code: ${code}`);
    return Response.json(result, { headers: jsonHeaders });
  } catch (error) {
    return Response.json({ error: error.message || 'Run failed' }, { status: 500, headers: jsonHeaders });
  }
});
