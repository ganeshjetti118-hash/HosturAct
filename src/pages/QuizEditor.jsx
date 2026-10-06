import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { callAction, getActivity, saveActivity } from '@/lib/activityApi';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Plus, Loader2, Sparkles, Upload, Save, Radio, Clock } from 'lucide-react';
import { ACTIVITY_TYPES, typeMeta, emptyItem } from '@/lib/activityMeta';
import QuizItemEditor from '@/components/editor/QuizItemEditor';
import GuessImageItemEditor from '@/components/editor/GuessImageItemEditor';
import CodeItemEditor from '@/components/editor/CodeItemEditor';
import FindDsaItemEditor from '@/components/editor/FindDsaItemEditor';

function genCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function parseJson(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

// Convert stored code test cases (objects) to editable text strings.
function forEditor(items, type) {
  return items.map((raw) => {
    const it = raw && typeof raw === 'object' ? raw : {};
    if (type === 'debug_code' || type === 'fast_code') {
      const tcs = (Array.isArray(it.test_cases) ? it.test_cases : []).map((tc) => ({
        input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input ?? []),
        expected: typeof tc.expected === 'string' ? tc.expected : JSON.stringify(tc.expected ?? '')
      }));
      return { ...emptyItem(type), ...it, test_cases: tcs.length ? tcs : [{ input: '[]', expected: '' }] };
    }
    if (type === 'quiz') {
      const options = Array.isArray(it.options) ? it.options : [];
      const correctIndex = Number.isInteger(it.correctIndex)
        ? it.correctIndex
        : Math.max(0, Number(it.correct_index) || 0);
      return {
        ...emptyItem('quiz'),
        ...it,
        options: Array.from({ length: 4 }, (_, index) => String(options[index] ?? '')),
        correctIndex: Math.min(correctIndex, 3),
      };
    }
    if (type === 'guess_image' || type === 'find_dsa') return { ...emptyItem(type), ...it };
    return it;
  });
}

// Convert editable text test cases back to objects for storage.
function forSave(items, type) {
  return items.map((it) => {
    const out = { ...it };
    if (type === 'debug_code' || type === 'fast_code') {
      out.test_cases = (it.test_cases || []).map((tc) => ({
        input: parseJson(tc.input, []),
        expected: parseJson(tc.expected, null)
      }));
    }
    return out;
  });
}

export default function QuizEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [type, setType] = useState('quiz');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [defaultTime, setDefaultTime] = useState(30);
  const [items, setItems] = useState([emptyItem('quiz')]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('manual');
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [error, setError] = useState('');

  const meta = typeMeta(type);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const q = await getActivity(id);
      setType(q.type || 'quiz');
      setTitle(q.title || '');
      setTopic(q.topic || '');
      setDescription(q.description || '');
      setDefaultTime(q.default_time_seconds || 30);
      const t = q.type || 'quiz';
      setItems(q.questions && q.questions.length ? forEditor(q.questions, t) : [emptyItem(t)]);
      setAiTopic(q.topic || '');
      setAiCount(typeMeta(t).defaultCount);
      setLoading(false);
    })();
  }, [id]);

  function changeType(t) {
    setType(t);
    setItems([emptyItem(t)]);
    setAiCount(typeMeta(t).defaultCount);
    setTab('manual');
    setError('');
  }

  function updateItem(i, patch) {
    setItems((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function addItem() { setItems((prev) => [...prev, emptyItem(type)]); }
  function removeItem(i) { setItems((prev) => prev.filter((_, idx) => idx !== i)); }

  function validate() {
    if (!title.trim()) return 'A title is required.';
    if (items.length < meta.min) return `Add at least ${meta.min} ${meta.singular.toLowerCase()}.`;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (type === 'quiz') {
        if (!it.text?.trim()) return `Question ${i + 1} is missing its text.`;
        if ((it.options || []).some((o) => !o?.trim())) return `Question ${i + 1} has an empty option.`;
      } else if (type === 'guess_image') {
        if (!it.answer?.trim()) return `Image ${i + 1} is missing its answer word.`;
        if (!it.image_url?.trim()) return `Image ${i + 1} is missing an image URL (use Generate with AI).`;
      } else if (type === 'debug_code' || type === 'fast_code') {
        if (!it.statement?.trim()) return `Problem ${i + 1} is missing its statement.`;
        if (!it.solution?.trim()) return `Problem ${i + 1} is missing its solution.`;
        if (!it.test_cases?.length) return `Problem ${i + 1} needs at least one test case.`;
        for (let t = 0; t < it.test_cases.length; t++) {
          try { JSON.parse(it.test_cases[t].input); } catch { return `Problem ${i + 1}, test case ${t + 1}: input must be valid JSON.`; }
          try { JSON.parse(it.test_cases[t].expected); } catch { return `Problem ${i + 1}, test case ${t + 1}: expected must be valid JSON.`; }
        }
      } else if (type === 'find_dsa') {
        if (!it.scenario?.trim()) return `Scenario ${i + 1} is missing its scenario.`;
        if (!it.answer?.trim()) return `Scenario ${i + 1} is missing its answer.`;
      }
    }
    return '';
  }

  async function save(launch = false) {
    const v = validate();
    if (v) { setError(v); return; }
    setError(''); setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        type,
        topic: topic.trim(),
        description: description.trim(),
        default_time_seconds: defaultTime,
        questions: forSave(items, type),
        status: launch ? 'active' : (isEdit ? undefined : 'draft'),
        join_code: isEdit ? undefined : genCode()
      };
      let saved;
      saved = await saveActivity(isEdit ? id : null, payload);
      if (launch) navigate(`/quiz/${saved.id}/room`);
      else navigate('/');
    } catch (e) {
      setError(e.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function generateAI() {
    const t = topic.trim() || aiTopic.trim();
    if (!t) { setError('Enter a topic to generate the activity.'); return; }
    setError(''); setGenerating(true);
    try {
      const result = await callAction('generate-activity', { type, topic: t, description: description.trim(), count: aiCount });
      if (Array.isArray(result?.items) && result.items.length) {
        setItems(forEditor(result.items, type));
        if (!topic) setTopic(t);
        setTab('manual');
      } else {
        setError('AI returned an invalid activity format. Please try again.');
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCsv(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setCsvLoading(true);
    try {
      const filePath = `imports/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('activity-files').upload(filePath, file);
      if (uploadError) throw uploadError;
      const result = await callAction('extract-csv-questions', { filePath });
      if (result?.questions?.length) {
        setItems(forEditor(result.questions, 'quiz'));
        setTab('manual');
      } else {
        setError('No questions detected in the file.');
      }
    } catch (e) {
      setError(e.message || 'Could not read the file.');
    } finally {
      setCsvLoading(false);
      e.target.value = '';
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  function renderItemEditor(it, i) {
    const common = { item: it, index: i, update: (p) => updateItem(i, p), remove: () => removeItem(i), defaultTime, canRemove: items.length > 1 };
    if (type === 'quiz') return <QuizItemEditor key={i} {...common} />;
    if (type === 'guess_image') return <GuessImageItemEditor key={i} {...common} />;
    if (type === 'debug_code' || type === 'fast_code') return <CodeItemEditor key={i} {...common} />;
    if (type === 'find_dsa') return <FindDsaItemEditor key={i} {...common} />;
    return null;
  }

  return (
    <div className="animate-fade-up max-w-4xl mx-auto">
      <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={14} /> Dashboard
      </button>
      <h1 className="font-display text-4xl font-semibold tracking-tightest leading-[1.05] mb-8">{isEdit ? 'Refine the Activity' : 'Compose a New Activity'}</h1>

      <div className="bg-card border border-border rounded-sm p-7 mb-6 flex flex-col gap-5">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Activity Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
            {ACTIVITY_TYPES.map((t) => {
              const Icon = t.icon;
              const active = type === t.key;
              return (
                <button key={t.key} onClick={() => changeType(t.key)}
                  className={`flex flex-col items-center gap-1.5 border rounded-sm px-2 py-3 text-center transition-all ${active ? 'border-gold bg-gold-soft' : 'border-border bg-background hover:border-foreground/30'}`}>
                  <Icon size={18} className={active ? 'text-gold' : 'text-muted-foreground'} />
                  <span className={`text-[11px] font-semibold leading-tight ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{t.label}</span>
                </button>
              );
            })}
          </div>
          {items.length > 0 && !isEdit && <p className="text-[11px] text-muted-foreground mt-2">Switching type resets the items.</p>}
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Architectural Frontiers & Design Systems"
            className="mt-1.5 w-full bg-background border border-border rounded-sm px-4 py-3 font-display text-lg focus:outline-none focus:border-gold transition-colors" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Topic</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Architecture"
              className="mt-1.5 w-full bg-background border border-border rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors" />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief framing of the activity"
              className="mt-1.5 w-full bg-background border border-border rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors" />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1 border-t border-border">
          <Clock size={15} className="text-gold" />
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Default Time / Item</label>
          <input type="number" min="0" max="900" value={defaultTime} onChange={(e) => setDefaultTime(Math.min(Math.max(Number(e.target.value) || 30, 0), 900))}
            className="w-20 bg-background border border-border rounded-sm px-2.5 py-1.5 text-sm tabular focus:outline-none focus:border-gold transition-colors" />
          <span className="text-xs text-muted-foreground">seconds · 0 = no time limit · override per item below</span>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-border mb-5">
        {[
          ['manual', 'Manual'],
          ...(['quiz', 'fast_code', 'find_dsa'].includes(type) ? [['ai', 'Generate with AI']] : []),
          ...(type === 'quiz' ? [['csv', 'Upload CSV']] : []),
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors ${tab === key ? 'border-gold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'ai' && (
        <div className="bg-card border border-border rounded-sm p-7 mb-6 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Describe a topic and the engine will author {aiCount} {meta.plural.toLowerCase()} for this {meta.label} activity{type === 'guess_image' ? ', including an image prompt for each item; add the image URL before saving' : ''}.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder={topic || 'e.g. Renaissance Art History'}
              className="flex-1 bg-background border border-border rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            <select value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))} className="bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold">
              {Array.from({ length: 20 }, (_, i) => i + 1).filter((n) => n >= meta.min).slice(0, 12).map((n) => <option key={n} value={n}>{n} {meta.plural.toLowerCase()}</option>)}
            </select>
            <button onClick={generateAI} disabled={generating}
              className="inline-flex items-center justify-center gap-2 bg-gold text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-sm hover:bg-gold/90 disabled:opacity-60 transition-colors">
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Generate
            </button>
          </div>
          <p className="text-xs text-muted-foreground">After generation you can review and fine-tune every item in the Manual tab.</p>
        </div>
      )}

      {tab === 'csv' && (
        <div className="bg-card border border-border rounded-sm p-7 mb-6 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Upload a CSV with columns: <span className="font-mono text-foreground">text, option1, option2, option3, option4, correctIndex</span> (1–4), and optionally <span className="font-mono text-foreground">points</span>.</p>
          <label className="inline-flex items-center gap-2 bg-foreground text-background text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-sm hover:bg-foreground/90 cursor-pointer transition-colors w-fit">
            {csvLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {csvLoading ? 'Reading…' : 'Choose CSV file'}
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleCsv} disabled={csvLoading} />
          </label>
        </div>
      )}

      {tab === 'manual' && (
        <div className="flex flex-col gap-4 mb-6">
          {items.map((it, i) => renderItemEditor(it, i))}
          <button onClick={addItem} className="inline-flex items-center justify-center gap-2 border border-dashed border-border rounded-sm py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
            <Plus size={14} /> Add {meta.singular}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-destructive mb-4 font-medium">{error}</p>}

      <div className="flex items-center gap-3 sticky bottom-4 bg-background/80 backdrop-blur border border-border rounded-sm p-3">
        <button onClick={() => save(false)} disabled={saving}
          className="inline-flex items-center gap-2 border border-border text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-sm hover:bg-muted disabled:opacity-60 transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Draft
        </button>
        <button onClick={() => save(true)} disabled={saving}
          className="inline-flex items-center gap-2 bg-foreground text-background text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-sm hover:bg-foreground/90 disabled:opacity-60 transition-colors">
          <Radio size={14} /> Save & Launch
        </button>
        <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">{items.length} {meta.plural.toLowerCase()}</span>
      </div>
    </div>
  );
}
