import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLeaderboard } from '@/lib/activityApi';
import Leaderboard from '@/components/Leaderboard';
import { typeMeta } from '@/lib/activityMeta';
import { Loader2, Crown, Medal, Trophy, ArrowLeft, Download } from 'lucide-react';
import { downloadResultsPdf } from '@/lib/resultsPdf';

function podiumAccent(rank) {
  if (rank === 1) return { border: 'border-gold', bg: 'bg-gold-soft', icon: <Crown className="text-gold" />, label: 'Champion', height: 'lg:pt-10' };
  if (rank === 2) return { border: 'border-primary/50', bg: 'bg-secondary', icon: <Medal className="text-primary/70" />, label: 'Runner-up', height: 'lg:pt-14' };
  return { border: 'border-primary/40', bg: 'bg-secondary/60', icon: <Medal className="text-primary/50" />, label: 'Third Place', height: 'lg:pt-18' };
}

function initials(name) {
  return (name || '').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

export default function Results() {
  const { quizId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setData(await getLeaderboard(quizId));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [quizId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  if (loading || !data) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  const { quiz, participants } = data;
  const podium = participants.slice(0, 3);
  const rest = participants.slice(3);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold tracking-tightest">HosturAct</Link>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold bg-gold-soft border border-gold/30 px-2.5 py-1 rounded-sm">Final Results</span>
            <button onClick={() => downloadResultsPdf(quiz, participants)} disabled={!participants.length}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
              <Download size={13} /> PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 animate-fade-up">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-2">
            {(() => { const m = typeMeta(quiz.type); const Icon = m.icon; return (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gold bg-gold-soft border border-gold/30 px-2.5 py-1 rounded-sm"><Icon size={12} /> {m.label}</span>
            ); })()}
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold mb-2">The Podium</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tightest leading-[1.05]">{quiz.title}</h1>
          {quiz.topic && <p className="text-sm text-muted-foreground mt-2">{quiz.topic}</p>}
        </div>

        {podium.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12 items-end">
            {[1, 0, 2].map(slot => {
              const p = podium[slot];
              if (!p) return <div key={slot} className="hidden md:block" />;
              const rank = slot + 1;
              const a = podiumAccent(rank);
              return (
                <div key={slot} className={`bg-card border ${a.border} rounded-sm p-7 flex flex-col items-center text-center ${a.height} ${rank === 1 ? 'md:order-2' : rank === 2 ? 'md:order-1' : 'md:order-3'}`}>
                  <div className="mb-3">{a.icon}</div>
                  <div className="w-14 h-14 rounded-sm flex items-center justify-center text-base font-bold mb-3"
                    style={{ background: rank === 1 ? 'hsl(var(--primary))' : rank === 2 ? 'hsl(var(--primary) / 0.75)' : 'hsl(var(--primary) / 0.5)', color: 'hsl(var(--primary-foreground))' }}>
                    {initials(p.nickname)}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{a.label}</span>
                  <h3 className="font-display text-xl font-semibold mt-1">{p.nickname}</h3>
                  <div className="text-3xl font-extrabold tabular text-foreground mt-2">{p.score.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1 tabular">{p.correctCount}/{p.totalQuestions || quiz.totalQuestions} correct · {p.totalQuestions ? Math.round((p.correctCount / p.totalQuestions) * 100) : 0}%</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 mb-12">
            <Trophy className="mx-auto text-muted-foreground mb-3" size={32} />
            <p className="font-display text-2xl">No participants yet</p>
            <p className="text-sm text-muted-foreground mt-1">Results will appear here once the quiz is taken.</p>
          </div>
        )}

        <div className="bg-card border border-border rounded-sm p-7 md:p-8">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
            <h2 className="font-display text-2xl font-semibold flex items-center gap-2.5"><Trophy size={18} className="text-gold" /> Full Standings</h2>
            <span className="text-xs font-semibold text-muted-foreground tabular">{participants.length} participants</span>
          </div>
          <Leaderboard participants={participants} totalQuestions={quiz.totalQuestions} />
        </div>

        <div className="text-center mt-10">
          <Link to="/join" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={14} /> Join another room
          </Link>
        </div>
      </main>
    </div>
  );
}
