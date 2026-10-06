import { Check } from 'lucide-react';

export default function QuizItem({ item, value, onChange, disabled }) {
  const selected = value;
  return (
    <div className="grid grid-cols-1 gap-3">
      {(item.options || []).map((opt, oi) => {
        const sel = selected === oi;
        return (
          <button key={oi} onClick={() => onChange(oi)} disabled={disabled}
            className={`flex items-center gap-3 border rounded-sm px-5 py-4 text-left transition-all disabled:cursor-not-allowed ${sel ? 'border-gold bg-gold-soft' : 'border-border bg-card hover:border-foreground/30'} ${disabled && !sel ? 'opacity-50' : ''}`}>
            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${sel ? 'border-gold bg-gold text-white' : 'border-border text-muted-foreground'}`}>
              {sel ? <Check size={13} /> : String.fromCharCode(65 + oi)}
            </span>
            <span className="text-sm font-medium">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}