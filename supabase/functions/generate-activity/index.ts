import { generateJson, jsonHeaders, corsPreflightResponse } from '../_shared/gemini.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  try {
    const { type, topic, description = '', count = 10 } = await req.json();
    const specifications: Record<string, string> = {
      quiz: 'Each item MUST be {"text":string,"options":[string,string,string,string],"correctIndex":number,"points":number,"time_seconds":null}. Give exactly four plausible, topic-specific options and use a zero-based correctIndex from 0 to 3. The correct option must be factual, distinct, and directly answer the question.',
      find_dsa: 'Each item MUST be {"scenario":string,"answer":string,"acceptable_answers":[string],"points":number,"time_seconds":null}. Each scenario must be a concrete situation related to the requested topic and description, and the answer must name the most appropriate data structure, algorithm, or technique.',
      fast_code: 'Each item MUST be {"statement":string,"starter_code":string,"solution":string,"test_cases":[{"input":string,"expected":string}],"language":"javascript","points":number,"time_seconds":null}. Each problem must use a distinct, topic-relevant scenario. starter_code must be a JavaScript function skeleton, solution must solve that exact problem, and every test input and expected value must be valid JSON strings matching that solution.',
    };
    if (!specifications[type]) throw new Error('AI generation is not available for this activity type.');
    const prompt = `Create exactly ${count} high-quality game items of type "${type}" about "${topic}". Additional context: ${description || 'None'}.
Return ONLY valid JSON in this exact shape: {"items":[...]}. No markdown, explanations, or extra fields.
Every item, answer, option, scenario, solution, and test case must be specific to both the topic and additional context. Do not use generic filler or repeat items.
${specifications[type]}`;
    return Response.json(await generateJson(prompt), { headers: jsonHeaders });
  } catch (error) {
    return Response.json({ error: error.message || 'Generation failed' }, { status: 500, headers: jsonHeaders });
  }
});
