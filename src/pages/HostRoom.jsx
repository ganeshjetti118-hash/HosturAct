import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLeaderboard, saveActivity } from '@/lib/activityApi';
import { supabase } from '@/lib/supabaseClient';
import QrCode from '@/components/QrCode';
import Leaderboard from '@/components/Leaderboard';
import { typeMeta } from '@/lib/activityMeta';
import { Copy, Check, Loader2, Radio, Trophy } from 'lucide-react';

export default function HostRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await getLeaderboard(id));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
    const channel = supabase.channel(`room-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `quiz_id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  async function endSession() {
    if (!confirm('End this session? The leaderboard will be finalized.')) return;
    await saveActivity(id, { status: 'ended' });
    navigate(`/results/${id}`);
  }

  function copyLink() {
    const url = `${window.location.origin}/join/${data.quiz.joinCode}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (loading || !data) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  const { quiz, participants, activeCount, completedCount } = data;
  const joinUrl = `${window.location.origin}/join/${quiz.joinCode}`;

  return (
    <div className="animate-fade-up">
      <header className="flex items-center justify-between border-b border-border pb-5 mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gold bg-gold-soft border border-gold/30 px-2.5 py-1 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-live-dot" /> Live
          </span>
          <span className="text-xs text-muted-foreground tabular">Session #{quiz.joinCode}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={endSession} className="inline-flex items-center gap-2 bg-foreground text-background text-xs font-semibold uppercase tracking-wider px-4 py-2.5 rounded-sm hover:bg-foreground/90 transition-colors">
            <Trophy size={13} /> End & View Results
          </button>
        </div>
      </header>

      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          {(() => { const m = typeMeta(quiz.type); const Icon = m.icon; return (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gold bg-gold-soft border border-gold/30 px-2.5 py-1 rounded-sm"><Icon size={12} /> {m.label}</span>
          ); })()}
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tightest leading-[1.05]">{quiz.title}</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          {quiz.description || `Active session broadcasted across ${participants.length} participant${participants.length !== 1 ? 's' : ''}. Scores calibrate instantly as responses stream in.`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
        <section className="bg-card border border-border rounded-sm p-8 flex flex-col items-center text-center animate-pulse-glow">
          <div className="w-full mb-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gold">Scan to Participate</p>
            <p className="font-display text-xl font-semibold mt-1">Join Active Room</p>
          </div>
          <QrCode value={joinUrl} size={200} />
          <div className="flex items-baseline justify-center gap-2 mt-5 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Room PIN</span>
            <span className="text-2xl font-extrabold tracking-[0.15em] tabular text-foreground">{quiz.joinCode}</span>
          </div>
          <button onClick={copyLink} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
            {copied ? <Check size={12} className="text-gold" /> : <Copy size={12} />}
            {copied ? 'Link copied' : 'Copy invite link'}
          </button>
          <div className="grid grid-cols-2 gap-3 w-full border-t border-border mt-6 pt-5">
            <div>
              <div className="text-2xl font-bold tabular text-foreground">{participants.length}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular text-foreground">{completedCount}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">Finished</div>
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-sm p-7 md:p-8">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
            <h2 className="font-display text-2xl font-semibold flex items-center gap-2.5">
              <Radio size={18} className="text-gold" /> Live Standings
            </h2>
            <span className="text-xs font-semibold text-muted-foreground tabular">{participants.length} joined · {activeCount} playing</span>
          </div>
          <Leaderboard participants={participants} totalQuestions={quiz.totalQuestions} />
        </section>
      </div>

      <section className="mt-8 border border-border rounded-sm bg-card grid grid-cols-1 lg:grid-cols-[420px_1fr] overflow-clip">
        <div className="w-full min-h-[180px] bg-gradient-to-br from-primary/20 via-gold-soft to-secondary" aria-hidden="true" />
        <div className="p-8 flex flex-col justify-center gap-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold">Real-Time Engine</p>
          <h3 className="font-display text-2xl font-semibold leading-tight">Scores calibrate the instant a response lands</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">Every answer streams through the engine and the leaderboard reorders without a refresh. When you're ready, end the session to reveal the final podium.</p>
          <div className="flex gap-8 border-t border-border pt-4">
            <div><div className="text-xl font-extrabold tabular">{quiz.totalQuestions}</div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{typeMeta(quiz.type).plural}</div></div>
            <div><div className="text-xl font-extrabold tabular">{participants.length}</div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">Participants</div></div>
            <div><div className="text-xl font-extrabold text-gold tabular">#1</div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">Gold Podium</div></div>
          </div>
        </div>
      </section>
    </div>
  );
}
