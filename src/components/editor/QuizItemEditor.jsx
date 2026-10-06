import { X, Clock } from 'lucide-react';

export default function QuizItemEditor({ item, index, update, remove, defaultTime, canRemove }) {
  function setOption(oi, val) {
    update({ options: item.options.map((o, x) => (x === oi ? val : o)) });
  }
  return (
    <div className="bg-card border border-border rounded-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-gold">Question {String(index + 1).padStart(2, '0')}</span>
        {canRemove && <button onClick={remove} className="text-muted-foreground hover:text-destructive transition-colors"><X size={15} /></button>}
      </div>
      <textarea value={item.text} onChange={(e) => update({ text: e.target.value })} placeholder="Question text" rows={2}
        className="w-full bg-background border border-border rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors resize-none" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
        {item.options.map((opt, oi) => (
          <div key={oi} className={`flex items-center gap-2 border rounded-sm px-3 py-2 transition-colors ${item.correctIndex === oi ? 'border-gold bg-gold-soft' : 'border-border bg-background'}`}>
            <button onClick={() => update({ correctIndex: oi })} type="button"
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${item.correctIndex === oi ? 'border-gold bg-gold' : 'border-border'}`}>
              {item.correctIndex === oi && <span className="w-2 h-2 bg-white rounded-full" />}
            </button>
            <input value={opt} onChange={(e) => setOption(oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="flex-1 bg-transparent text-sm focus:outline-none" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Points</label>
          <select value={item.points} onChange={(e) => update({ points: Number(e.target.value) })} className="bg-background border border-border rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-gold">
            <option value={1}>1 (Easy)</option>
            <option value={2}>2 (Hard)</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-muted-foreground" />
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={item.time_seconds == null} onChange={(e) => update({ time_seconds: e.target.checked ? null : defaultTime })} className="accent-gold" />
            Default ({defaultTime}s)
          </label>
          {item.time_seconds != null && (
            <input type="number" min="0" max="600" value={item.time_seconds} onChange={(e) => update({ time_seconds: Math.min(Math.max(Number(e.target.value) || defaultTime, 0), 600) })}
              className="w-16 bg-background border border-border rounded-sm px-2 py-1.5 text-xs tabular focus:outline-none focus:border-gold transition-colors" />
          )}
          {item.time_seconds != null && <span className="text-[11px] text-muted-foreground">sec</span>}
        </div>
      </div>
    </div>
  );
}