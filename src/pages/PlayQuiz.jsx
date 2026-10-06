import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { callAction } from '@/lib/activityApi';
import { Loader2, ArrowRight, ArrowLeft, Check, Clock } from 'lucide-react';
import { typeMeta } from '@/lib/activityMeta';
import QuizItem from '@/components/play/QuizItem';
import GuessImageItem from '@/components/play/GuessImageItem';
import CodeItem from '@/components/play/CodeItem';
import FindDsaItem from '@/components/play/FindDsaItem';

function seedAnswers(items, type) {
  const seed = {};
  items.forEach((it, i) => {
    if (type === 'debug_code' || type === 'fast_code') seed[i] = it.starter_code || '';
    else if (type === 'quiz') seed[i] = undefined;
    else seed[i] = '';
  });
  return seed;
}

export default function PlayQuiz() {
  const { participantId } = useParams();
  const navigate = useNavigate();
  const stored = sessionStorage.getItem(`qm_play_${participantId}`);
  let activity = null, nickname = '';
  try {
    const parsed = stored ? JSON.parse(stored) : null;
    activity = parsed?.quiz;
    nickname = parsed?.nickname || '';
  } catch { activity = null; }

  const items = activity?.items || [];
  const total = items.length;
  const defaultTime = activity?.default_time_seconds || 30;
  const type = activity?.type || 'quiz';
  const meta = typeMeta(type);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(() => seedAnswers(items, type));
  const [timeLeft, setTimeLeft] = useState(0);
  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const answersRef = useRef({});
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const finish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const answerArray = items.map((it, i) => ({
      itemIndex: it._orig ?? i,
      answer: type === 'quiz' ? (answersRef.current[i] ?? -1) : (answersRef.current[i] ?? '')
    }));
    try {
      await callAction('submit-quiz', { participantId, answers: answerArray });
      sessionStorage.removeItem(`qm_play_${participantId}`);
      navigate(`/play/result/${participantId}`);
    } catch (e) {
      setSubmitting(false);
      alert(e.response?.data?.error || e.message || 'Could not submit.');
    }
  }, [participantId, items, type, navigate, submitting]);

  const finishRef = useRef(finish);
  useEffect(() => { finishRef.current = finish; }, [finish]);

  useEffect(() => {
    if (!items.length) return;
    const it = items[current];
    const dur = it?.time_seconds || defaultTime;
    setTimeLeft(dur);
    setLocked(false);
    if (dur <= 0) return;
    const start = Date.now();
    const id = setInterval(() => {
      const remaining = Math.max(0, dur - (Date.now() - start) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        if (type === 'quiz') setAnswers((prev) => (prev[current] === undefined ? { ...prev, [current]: -1 } : prev));
        setLocked(true);
        if (current < total - 1) setTimeout(() => setCurrent((c) => c + 1), 700);
        else setTimeout(() => finishRef.current(), 700);
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, items]);

  if (!activity || !items.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="font-display text-2xl mb-2">Session expired</p>
          <p className="text-sm text-muted-foreground mb-5">This play session is no longer available. Please re-enter the room PIN.</p>
          <button onClick={() => navigate('/join')} className="inline-flex items-center gap-2 bg-foreground text-background text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-sm">Enter a room</button>
        </div>
      </div>
    );
  }

  const it = items[current];
  const duration = it.time_seconds || defaultTime;
  const hasTimer = duration > 0;
  const progress = hasTimer ? (timeLeft / duration) * 100 : 100;
  const urgent = hasTimer && timeLeft <= 5;
  const answeredCount = type === 'quiz'
    ? Object.values(answers).filter((v) => v !== undefined && v !== -1).length
    : Object.values(answers).filter((v) => v && String(v).trim()).length;

  function setVal(v) { setAnswers((prev) => ({ ...prev, [current]: v })); }
  function next() { if (current < total - 1) setCurrent((c) => c + 1); else finish(); }

  function renderItem() {
    const props = { item: it, value: answers[current], onChange: setVal, disabled: locked, activityId: activity.id, itemIndex: it._orig ?? current };
    if (type === 'quiz') return <QuizItem {...props} />;
    if (type === 'guess_image') return <GuessImageItem {...props} />;
    if (type === 'debug_code' || type === 'fast_code') return <CodeItem {...props} />;
    if (type === 'find_dsa') return <FindDsaItem {...props} />;
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-lg font-bold tracking-tightest">HosturAct</span>
          <span className="text-xs text-muted-foreground tabular">{answeredCount}/{total} {meta.plural.toLowerCase()}</span>
        </div>
        {hasTimer && (
          <div className="h-1 bg-border">
            <div className={`h-full transition-all duration-100 ease-linear ${urgent ? 'bg-destructive' : 'bg-gold'}`} style={{ width: `${progress}%` }} />
          </div>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl animate-fade-up" key={current}>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gold mb-2">{meta.singular} {String(current + 1).padStart(2, '0')} of {String(total).padStart(2, '0')}</p>
              {type === 'quiz' && <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tightest leading-[1.12]">{it.text}</h1>}
              {nickname && <p className="text-xs text-muted-foreground mt-3">Playing as <span className="font-semibold text-foreground">{nickname}</span></p>}
            </div>
            {hasTimer && (
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-sm border shrink-0 ${urgent ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'}`}>
                <Clock size={14} className={urgent ? 'text-destructive' : 'text-gold'} />
                <span className={`text-lg font-bold tabular ${urgent ? 'text-destructive' : 'text-foreground'}`}>{Math.ceil(timeLeft)}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">sec</span>
              </div>
            )}
          </div>

          {renderItem()}

          {locked && <p className="text-xs text-destructive font-medium mt-4">Time's up — recorded as unanswered, moving on…</p>}

          <div className="flex items-center justify-between mt-8 gap-3">
            <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
            {current < total - 1 ? (
              <button onClick={next}
                className="inline-flex items-center gap-2 bg-foreground text-background text-xs font-semibold uppercase tracking-wider px-6 py-3 rounded-sm hover:bg-foreground/90 transition-colors">
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button onClick={finish} disabled={submitting}
                className="inline-flex items-center gap-2 bg-gold text-white text-xs font-semibold uppercase tracking-wider px-6 py-3 rounded-sm hover:bg-gold/90 disabled:opacity-60 transition-colors">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {submitting ? 'Submitting…' : 'Finish'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
