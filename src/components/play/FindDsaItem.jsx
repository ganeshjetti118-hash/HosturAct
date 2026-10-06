export default function FindDsaItem({ item, value, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-secondary/50 border border-border rounded-sm p-5">
        <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">{item.scenario}</p>
      </div>
      <div>
        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Which data structure / algorithm topic is used?</label>
        <input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoFocus
          placeholder="e.g. Dynamic Programming"
          className="mt-1.5 w-full bg-background border border-border rounded-sm px-4 py-3 text-base font-display focus:outline-none focus:border-gold transition-colors disabled:opacity-60"
        />
      </div>
    </div>
  );
}