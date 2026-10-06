import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getParticipantResult } from '@/lib/activityApi';
import { typeMeta } from '@/lib/activityMeta';
import { Loader2, Trophy, Check, X, ArrowRight, Crown, Medal } from 'lucide-react';

function AnswerReview({ type, items, graded }) {
  return (
    <ol className="flex flex-col gap-3">
      {graded.map((a, i) => {
        const it = items[a.itemIndex] || {};
        let prompt = '';
        let yourAnswer = '';
        let correctAnswer = '';
        if (type === 'quiz') {
          prompt = it.text || `Question ${i + 1}`;
          yourAnswer = a.answer >= 0 ? it.options?.[a.answer] || '—' : 'No answer';
          correctAnswer = it.options?.[it.correctIndex];
        } else if (type === 'guess_image') {
          prompt = `Guess the image${it.hint ? ` · ${it.hint}` : ''}`;
          yourAnswer = a.answer || 'No answer';
          correctAnswer = a.expected || it.answer;
        } else if (type === 'debug_code' || type === 'fast_code') {
          prompt = it.statement || `Problem ${i + 1}`;
          yourAnswer = a.answer ? `${String(a.answer).slice(0, 80)}…` : 'No code';
          correctAnswer = it.solution ? `${String(it.solution).slice(0, 80)}…` : '';
        } else if (type === 'find_dsa') {
          prompt = it.scenario || `Scenario ${i + 1}`;
          yourAnswer = a.answer || 'No answer';
          correctAnswer = a.expected || it.answer;
        }
        return (
          <li key={i} className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${a.correct ? 'bg-primary text-primary-foreground' : 'bg-destructive/10 text-destructive'}`}>
              {a.correct ? <Check size={12} /> : <X size={12} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{i + 1}. {prompt}</p>
              {(type === 'debug_code' || type === 'fast_code') ? (
                <>
                  <p className="text-xs text-muted-foreground mt-0.5">Your code: <span className="font-mono text-foreground">{yourAnswer}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tests: <span className="tabular text-foreground">{a.passed}/{a.total} passed</span></p>
                  {correctAnswer && !a.correct && <p className="text-xs text-muted-foreground mt-0.5">Solution: <span className="font-mono text-foreground">{correctAnswer}</span></p>}
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mt-0.5">Your answer: <span className="text-foreground font-medium">{yourAnswer}</span></p>
                  {!a.correct && correctAnswer && <p className="text-xs text-muted-foreground mt-0.5">Correct: <span className="text-foreground font-medium">{correctAnswer}</span></p>}
                </>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function PlayerResult() {
  const { participantId } = useParams();
  const [p, setP] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await getParticipantResult(participantId);
        setP(result.participant);
        if (result.participant?.quiz_id) {
          setQuiz(result.quiz);
          const list = result.participants || [];
          const idx = list.findIndex((x) => x.id === participantId);
          setRank(idx >= 0 ? idx + 1 : null);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [participantId]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  if (!p) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="font-display text-2xl mb-2">Result unavailable</p>
          <p className="text-sm text-muted-foreground mb-5">This result could not be loaded. Please re-enter the room PIN.</p>
          <Link to="/join" className="inline-flex items-center gap-2 bg-foreground text-background text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-sm">Enter a room</Link>
        </div>
      </div>
    );
  }

  const type = quiz?.type || 'quiz';
  const meta = typeMeta(type);
  const total = p.total_questions || 0;
  const correct = p.correct_count || 0;
  const score = p.score || 0;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const graded = Array.isArray(p.answers) ? p.answers : [];
  const items = Array.isArray(quiz?.questions) ? quiz.questions : [];

  const podiumAccent = rank === 1
    ? { icon: <Crown className="text-gold" />, text: 'text-gold' }
    : rank === 2 ? { icon: <Medal className="text-primary/70" />, text: 'text-primary/70' }
    : rank === 3 ? { icon: <Medal className="text-primary/50" />, text: 'text-primary/50' }
    : { icon: null, text: 'text-muted-foreground' };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-lg font-bold tracking-tightest">HosturAct</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-gold bg-gold-soft border border-gold/30 px-2.5 py-1 rounded-sm">Your Result</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-2xl animate-fade-up">
          <div className="text-center mb-10">
            {rank && rank <= 3 ? (
              <div className="flex justify-center mb-4">{podiumAccent.icon}</div>
            ) : (
              <Trophy className="mx-auto text-gold mb-4" size={32} />
            )}
            <div className="flex justify-center mb-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gold bg-gold-soft border border-gold/30 px-2.5 py-1 rounded-sm">{(() => { const Icon = meta.icon; return <><Icon size={12} /> {meta.label}</>; })()}</span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gold mb-2">Activity Complete</p>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tightest leading-[1.05]">{quiz?.title || 'Activity'}</h1>
            {quiz?.topic && <p className="text-sm text-muted-foreground mt-2">{quiz.topic}</p>}
            {p.nickname && <p className="text-xs text-muted-foreground mt-3">Playing as <span className="font-semibold text-foreground">{p.nickname}</span></p>}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-card border border-border rounded-sm p-5 text-center">
              <div className="text-3xl font-extrabold tabular text-foreground">{score.toLocaleString()}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">Score</div>
            </div>
            <div className="bg-card border border-border rounded-sm p-5 text-center">
              <div className="text-3xl font-extrabold tabular text-foreground">{correct}/{total}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">Correct</div>
            </div>
            <div className="bg-card border border-border rounded-sm p-5 text-center">
              <div className="text-3xl font-extrabold tabular text-foreground">{accuracy}%</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">Accuracy</div>
            </div>
          </div>

          {rank && (
            <div className="bg-card border border-border rounded-sm p-5 mb-8 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Your Rank</span>
              <span className={`flex items-center gap-2 text-2xl font-extrabold tabular ${podiumAccent.text}`}>
                {podiumAccent.icon} #{rank}
              </span>
            </div>
          )}

          {graded.length > 0 && items.length > 0 && (
            <div className="bg-card border border-border rounded-sm p-6 md:p-7 mb-8">
              <h2 className="font-display text-lg font-semibold mb-4">Review</h2>
              <AnswerReview type={type} items={items} graded={graded} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/join" className="inline-flex items-center gap-2 bg-foreground text-background text-xs font-semibold uppercase tracking-wider px-6 py-3 rounded-sm hover:bg-foreground/90 transition-colors">
              Join Another Room <ArrowRight size={14} />
            </Link>
            {quiz?.id && (
              <Link to={`/results/${quiz.id}`} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors">
                <Trophy size={13} /> View Full Leaderboard
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
