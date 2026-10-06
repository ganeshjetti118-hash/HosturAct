import { useState } from 'react';
import { callAction } from '@/lib/activityApi';
import { Loader2, Play, CheckCircle2, XCircle } from 'lucide-react';

export default function CodeItem({ item, value, onChange, disabled, activityId, itemIndex }) {
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  async function run() {
    setRunning(true); setRunResult(null);
    try {
      setRunResult(await callAction('run-activity-code', { activityId, itemIndex, code: value || '' }));
    } catch (e) {
      setRunResult({ error: e.response?.data?.error || e.message || 'Run failed' });
    } finally { setRunning(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-secondary/50 border border-border rounded-sm p-4">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{item.statement}</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Your Solution (JavaScript)</label>
          <button onClick={run} disabled={disabled || running}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gold hover:text-foreground disabled:opacity-50 transition-colors">
            {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Run Tests
          </button>
        </div>
        <textarea
          value={value ?? item.starter_code ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          spellCheck={false}
          rows={10}
          className="w-full bg-background border border-border rounded-sm px-4 py-3 font-mono text-sm leading-relaxed focus:outline-none focus:border-gold transition-colors disabled:opacity-60 resize-y"
        />
      </div>
      {runResult && !runResult.error && (
        <div className="border border-border rounded-sm p-4 bg-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Test Results</span>
            <span className={`text-sm font-bold tabular ${runResult.passedCount === runResult.totalCount ? 'text-primary' : 'text-destructive'}`}>
              {runResult.passedCount}/{runResult.totalCount} passed
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {(runResult.results || []).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {r.passed ? <CheckCircle2 size={14} className="text-primary shrink-0" /> : <XCircle size={14} className="text-destructive shrink-0" />}
                <span className="text-muted-foreground">Test {i + 1}</span>
                {r.error && <span className="text-destructive text-xs truncate">{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {runResult?.error && <p className="text-sm text-destructive">{runResult.error}</p>}
    </div>
  );
}
