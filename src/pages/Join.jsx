import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { callAction } from '@/lib/activityApi';
import { Loader2, ArrowRight } from 'lucide-react';

export default function Join() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState(code || '');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!joinCode.trim() || !nickname.trim()) { setError('Enter both the room code and your name.'); return; }
    setError(''); setLoading(true);
    try {
      const { participantId, quiz } = await callAction('join-quiz', { joinCode: joinCode.trim().toUpperCase(), nickname: nickname.trim() });
      // Jumble item order per participant, keeping each item's contents intact.
      const shuffled = (quiz.items || []).map((q, i) => ({ ...q, _orig: i }));
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      quiz.items = shuffled;
      sessionStorage.setItem(`qm_play_${participantId}`, JSON.stringify({ quiz, participantId, nickname: nickname.trim() }));
      navigate(`/play/${participantId}`);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not join.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-center">
          <span className="font-display text-xl font-bold tracking-tightest">HosturAct</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-up">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold text-center mb-3">Participant Entry</p>
          <h1 className="font-display text-4xl font-semibold tracking-tightest leading-tight text-center mb-2">Step Into the Round</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">Enter the room PIN shown on screen and the name you'd like to compete under.</p>

          <form onSubmit={submit} className="bg-card border border-border rounded-sm p-7 flex flex-col gap-5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Room PIN</label>
              <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123"
                className="mt-1.5 w-full bg-background border border-border rounded-sm px-4 py-3 text-lg font-bold tracking-[0.2em] tabular text-center focus:outline-none focus:border-gold transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Your Name</label>
              <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g. Elena Kostas" maxLength={32}
                className="mt-1.5 w-full bg-background border border-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors" />
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            <button type="submit" disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-foreground text-background text-xs font-semibold uppercase tracking-wider px-5 py-3.5 rounded-sm hover:bg-foreground/90 disabled:opacity-60 transition-colors">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <>Start <ArrowRight size={14} /></>}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
