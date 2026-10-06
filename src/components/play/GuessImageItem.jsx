import { Image } from '@/components/ui/image';

export default function GuessImageItem({ item, value, onChange, disabled }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-md aspect-square rounded-sm overflow-hidden border border-border bg-muted">
        {item.image_url ? (
          <Image src={item.image_url} fittingType="fill" alt="Guess the subject" className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
        )}
      </div>
      {item.hint && <p className="text-sm text-muted-foreground text-center">Hint: {item.hint}</p>}
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoFocus
        placeholder="Type your guess…"
        className="w-full max-w-md bg-background border border-border rounded-sm px-4 py-3 text-lg text-center font-display focus:outline-none focus:border-gold transition-colors disabled:opacity-60"
      />
    </div>
  );
}