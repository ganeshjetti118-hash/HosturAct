import { Crown, Medal } from 'lucide-react';

function initials(name) {
  return (name || '').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

function rankClass(rank) {
  if (rank === 1) return 'top-1';
  if (rank === 2) return 'top-2';
  if (rank === 3) return 'top-3';
  return '';
}

export default function Leaderboard({ participants, totalQuestions, compact = false }) {
  if (!participants || participants.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="font-display text-lg text-foreground/70">No scores yet</p>
        <p className="text-sm mt-1">Participants will appear here as they finish.</p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {participants.map((p, i) => {
        const rank = i + 1;
        const cls = rankClass(rank);
        return (
          <li
            key={p.id}
            className={`qm-row ${cls} grid items-center rounded-sm border border-transparent transition-all`}
            style={{
              gridTemplateColumns: compact ? '40px 1fr 90px' : '40px 1fr 110px 90px',
              padding: '12px 16px',
              background: rank === 1 ? 'rgba(99,102,241,0.06)' : rank === 2 ? 'rgba(99,102,241,0.03)' : rank === 3 ? 'rgba(99,102,241,0.02)' : 'hsl(var(--muted))',
              borderColor: rank === 1 ? 'hsl(var(--gold))' : rank === 2 ? 'rgba(99,102,241,0.6)' : rank === 3 ? 'rgba(99,102,241,0.35)' : 'transparent'
            }}
          >
            <span className="text-sm font-bold text-muted-foreground tabular flex items-center gap-1">
              {rank === 1 ? <Crown size={14} className="text-gold" /> : rank === 2 ? <Medal size={13} className="text-primary/70" /> : rank === 3 ? <Medal size={13} className="text-primary/50" /> : null}
              {String(rank).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-sm flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{
                  background: rank === 1 ? 'hsl(var(--primary))' : rank === 2 ? 'hsl(var(--primary) / 0.75)' : rank === 3 ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border))',
                  color: rank <= 3 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
                }}
              >
                {initials(p.nickname)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-foreground truncate">{p.nickname}</span>
                {!compact && (
                  <span className="text-[11px] text-muted-foreground">
                    {p.completed ? `${p.correctCount}/${p.totalQuestions || totalQuestions} correct` : 'In progress…'}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-[15px] font-bold text-foreground tabular">
              {p.score.toLocaleString()}
            </div>
            {!compact && (
              <div className="text-right text-xs font-semibold text-muted-foreground tabular">
                {p.totalQuestions ? Math.round((p.correctCount / p.totalQuestions) * 100) : 0}%
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}