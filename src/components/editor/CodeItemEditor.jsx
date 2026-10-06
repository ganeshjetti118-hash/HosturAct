import { X, Clock, Plus, Trash2 } from 'lucide-react';

function TestCaseRow({ tc, onChange, onRemove }) {
  return (
    <div className="flex items-start gap-2">
      <input value={tc.input} onChange={(e) => onChange({ ...tc, input: e.target.value })} placeholder='input e.g. [1,2,3]'
        className="flex-1 bg-background border border-border rounded-sm px-3 py-2 text-xs font-mono focus:outline-none focus:border-gold transition-colors" />
      <input value={tc.expected} onChange={(e) => onChange({ ...tc, expected: e.target.value })} placeholder='expected e.g. 6'
        className="flex-1 bg-background border border-border rounded-sm px-3 py-2 text-xs font-mono focus:outline-none focus:border-gold transition-colors" />
      <button onClick={onRemove} className="mt-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
    </div>
  );
}

export default function CodeItemEditor({ item, index, update, remove, defaultTime, canRemove }) {
  function setTc(i, val) { update({ test_cases: item.test_cases.map((t, x) => (x === i ? val : t)) }); }
  function addTc() { update({ test_cases: [...item.test_cases, { input: '[]', expected: '' }] }); }
  function removeTc(i) { update({ test_cases: item.test_cases.filter((_, x) => x !== i) }); }

  return (
    <div className="bg-card border border-border rounded-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-gold">Problem {String(index + 1).padStart(2, '0')}</span>
        {canRemove && <button onClick={remove} className="text-muted-foreground hover:text-destructive transition-colors"><X size={15} /></button>}
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Statement</label>
          <textarea value={item.statement} onChange={(e) => update({ statement: e.target.value })} placeholder="Describe the problem / bug" rows={2}
            className="mt-1.5 w-full bg-background border border-border rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors resize-none" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Starter Code (buggy / skeleton)</label>
            <textarea value={item.starter_code} onChange={(e) => update({ starter_code: e.target.value })} rows={7} spellCheck={false}
              className="mt-1.5 w-full bg-background border border-border rounded-sm px-3 py-2.5 text-xs font-mono leading-relaxed focus:outline-none focus:border-gold transition-colors resize-y" />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Solution (correct)</label>
            <textarea value={item.solution} onChange={(e) => update({ solution: e.target.value })} rows={7} spellCheck={false}
              className="mt-1.5 w-full bg-background border border-border rounded-sm px-3 py-2.5 text-xs font-mono leading-relaxed focus:outline-none focus:border-gold transition-colors resize-y" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Test Cases (JSON input → expected)</label>
            <button onClick={addTc} className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:text-foreground transition-colors"><Plus size={12} /> Add</button>
          </div>
          <div className="flex flex-col gap-2">
            {item.test_cases.map((tc, i) => <TestCaseRow key={i} tc={tc} onChange={(v) => setTc(i, v)} onRemove={() => removeTc(i)} />)}
          </div>
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
              <input type="number" min="0" max="900" value={item.time_seconds} onChange={(e) => update({ time_seconds: Math.min(Math.max(Number(e.target.value) || defaultTime, 0), 900) })}
                className="w-16 bg-background border border-border rounded-sm px-2 py-1.5 text-xs tabular focus:outline-none focus:border-gold transition-colors" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}