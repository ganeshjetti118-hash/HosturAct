export const jsonHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const corsPreflightResponse = () =>
  new Response('ok', { headers: jsonHeaders });

// Gemini requires new projects to use its current Flash-Lite model.
const MODEL = 'gemini-3.5-flash-lite';

/** Generates an object response without exposing the Gemini key to the browser. */
export async function generateJson(prompt: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY Edge Function secret is missing.');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Gemini request failed (${response.status}).`);
  }
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('');
  if (!text) throw new Error('Gemini returned no content.');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Gemini returned invalid JSON. Please try again.');
  }
}
