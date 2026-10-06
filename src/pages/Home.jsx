import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteActivity, listActivities, saveActivity } from '@/lib/activityApi';
import { Plus, Edit3, Trash2, Users, Loader2, Radio, ArrowRight, Trophy, Archive } from 'lucide-react';
import { typeMeta } from '@/lib/activityMeta';

function statusBadge(status) {
  if (status === 'active') return { label: 'Live', cls: 'text-gold bg-gold-soft border-gold/30' };
  if (status === 'ended') return { label: 'Ended', cls: 'text-muted-foreground bg-muted border-border' };
  return { label: 'Draft', cls: 'text-foreground/70 bg-card border-border' };
}

export default function Home() {
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    const data = await listActivities();
    setActivities(data);
    setLoading(false);
  }

  useEffect(() => {load();}, []);

  async function launch(id) {
    await saveActivity(id, { status: 'active' });
    navigate(`/quiz/${id}/room`);
  }

  async function remove(id) {
    if (!confirm('Delete this activity and all its participant data?')) return;
    await deleteActivity(id);
    load();
  }

  const active = (activities || []).filter((q) => q.status !== 'ended');
  const past = (activities || []).filter((q) => q.status === 'ended');

  function Card({ a, ended = false }) {
    const b = statusBadge(a.status);
    const meta = typeMeta(a.type);
    const Icon = meta.icon;
    return (
      <div className="bg-card border border-border rounded-sm p-6 flex flex-col gap-4 hover:border-foreground/20 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border ${b.cls}`}>
            {a.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-gold animate-live-dot" />}
            {b.label}
          </span>
          <span className="text-[11px] text-muted-foreground tabular">{a.join_code}</span>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gold"><Icon size={12} /> {meta.label}</span>
          </div>
          <h3 className="font-display text-xl font-semibold leading-tight tracking-tight">{a.title}</h3>
          {a.topic && <p className="text-xs text-gold font-medium mt-1 uppercase tracking-wide">{a.topic}</p>}
          {a.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.description}</p>}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
          <span className="flex items-center gap-1.5"><Icon size={13} /> {(a.questions || []).length} {meta.plural.toLowerCase()}</span>
          <span className="flex items-center gap-1.5"><Users size={13} /> 0 players</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button onClick={() => navigate(`/quiz/${a.id}/edit`)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide border border-border rounded-sm py-2 hover:bg-muted transition-colors">
            <Edit3 size={13} /> Edit
          </button>
          {ended ?
          <button onClick={() => navigate(`/results/${a.id}`)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide bg-muted text-foreground rounded-sm py-2 hover:bg-muted/70 transition-colors">
              <Trophy size={13} /> Results
            </button> :
          a.status === 'active' ?
          <button onClick={() => navigate(`/quiz/${a.id}/room`)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide bg-gold text-white rounded-sm py-2 hover:bg-gold/90 transition-colors">
               Open Room
            </button> :

          <button onClick={() => launch(a.id)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide bg-foreground text-background rounded-sm py-2 hover:bg-foreground/90 transition-colors">
              <Radio size={13} /> Launch
            </button>
          }
          <button onClick={() => remove(a.id)} className="inline-flex items-center justify-center w-9 border border-border rounded-sm py-2 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>);

  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold mb-2">Host Console</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tightest leading-[1.05]">Your Activities</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg">Create quizzes, code challenges, image guessing and more — broadcast via QR, and watch the leaderboard calibrate in real time.</p>
        </div>
        <Link to="/quiz/new" className="inline-flex items-center gap-2 bg-foreground text-background text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-sm hover:bg-foreground/90 transition-colors">
          <Plus size={15} /> New Activity
        </Link>
      </div>

      {loading ?
      <div className="flex justify-center py-24"><Loader2 className="animate-spin text-muted-foreground" /></div> :
      activities && activities.length > 0 ?
      <div className="flex flex-col gap-10">
          {active.length > 0 &&
        <section>
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Active · {active.length}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {active.map((a) => <Card key={a.id} a={a} />)}
              </div>
            </section>
        }
          {past.length > 0 &&
        <section>
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2"><Archive size={14} /> Past Activities · {past.length}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {past.map((a) => <Card key={a.id} a={a} ended />)}
              </div>
            </section>
        }
        </div> :

      <div className="bg-card border border-border rounded-sm p-16 text-center">
          <p className="font-display text-2xl text-foreground/80">No activities yet</p>
          <p className="text-sm text-muted-foreground mt-2 mb-6">Craft your first activity — a quiz, code challenge, image guess, or DSA game — generated by AI or authored by hand.</p>
          <Link to="/quiz/new" className="inline-flex items-center gap-2 bg-foreground text-background text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-sm hover:bg-foreground/90 transition-colors">
            <Plus size={15} /> Create Activity <ArrowRight size={14} />
          </Link>
        </div>
      }
    </div>);

}
