import { X, Clock } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function GuessImageItemEditor({ item, index, update, remove, defaultTime, canRemove }) {
  return (
    <div className="bg-card border border-border rounded-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-gold">Image {String(index + 1).padStart(2, '0')}</span>
        {canRemove && <button onClick={remove} className="text-muted-foreground hover:text-destructive transition-colors"><X size={15} /></button>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4">
        <div className="aspect-square rounded-sm overflow-hidden border border-border bg-muted">
          {item.image_url ? (
            <Image src={item.image_url} fittingType="fill" alt="Preview" className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[11px] text-center px-2">No image yet</div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Image URL</label>
            <input value={item.image_url} onChange={(e) => update({ image_url: e.target.value })} placeholder="https://… (AI generates this)"
              className="mt-1.5 w-full bg-background border border-border rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-gold transition-colors" />
          </div>
          {item.image_prompt && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Suggested image prompt</label>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed border border-border rounded-sm px-3 py-2 bg-muted/40">{item.image_prompt}</p>
            </div>
          )}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Answer (the word)</label>
            <input value={item.answer} onChange={(e) => update({ answer: e.target.value })} placeholder="e.g. Lighthouse"
              className="mt-1.5 w-full bg-background border border-border rounded-sm px-3 py-2 text-sm font-display focus:outline-none focus:border-gold transition-colors" />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Hint</label>
            <input value={item.hint} onChange={(e) => update({ hint: e.target.value })} placeholder="A short clue"
              className="mt-1.5 w-full bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-gold transition-colors" />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
