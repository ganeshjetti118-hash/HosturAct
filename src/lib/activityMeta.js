import { FileText, Image, Bug, Code2, Search } from 'lucide-react';

export const ACTIVITY_TYPES = [
  { key: 'quiz', label: 'Quiz', singular: 'Question', plural: 'Questions', icon: FileText, defaultCount: 10, min: 1 },
  { key: 'guess_image', label: 'Guess the Image', singular: 'Image', plural: 'Images', icon: Image, defaultCount: 6, min: 1 },
  { key: 'debug_code', label: 'Debug & Fix Code', singular: 'Problem', plural: 'Problems', icon: Bug, defaultCount: 3, min: 1 },
  { key: 'fast_code', label: 'Fast Code Writing', singular: 'Problem', plural: 'Problems', icon: Code2, defaultCount: 3, min: 1 },
  { key: 'find_dsa', label: 'Find the DSA Topic', singular: 'Scenario', plural: 'Scenarios', icon: Search, defaultCount: 5, min: 1 }
];

export function typeMeta(key) {
  return ACTIVITY_TYPES.find((t) => t.key === key) || ACTIVITY_TYPES[0];
}

export function emptyItem(type) {
  const base = { points: 1, time_seconds: null };
  if (type === 'quiz') return { text: '', options: ['', '', '', ''], correctIndex: 0, ...base };
  if (type === 'guess_image') return { image_url: '', image_prompt: '', answer: '', hint: '', ...base };
  if (type === 'debug_code' || type === 'fast_code')
    return { statement: '', starter_code: 'function solution() {\n  // your code here\n}\n', solution: '', test_cases: [{ input: [], expected: null }], language: 'javascript', ...base };
  if (type === 'find_dsa') return { scenario: '', answer: '', acceptable_answers: [], ...base };
  return base;
}
