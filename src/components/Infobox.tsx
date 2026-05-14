import type { InfoboxItem } from '../types';

type InfoboxProps = {
  metadata: InfoboxItem[];
};

export function Infobox({ metadata }: InfoboxProps) {
  return (
    <div className="rounded-3xl border border-brass/10 bg-[#0d0b0b] p-6 shadow-library">
      <div className="mb-4 text-xs uppercase tracking-[0.35em] text-brass/70">Infobox</div>
      <div className="space-y-4">
        {metadata.map((item) => (
          <div key={item.label} className="grid gap-2 text-sm">
            <div className="text-[11px] uppercase tracking-[0.3em] text-stone/50">{item.label}</div>
            <div className="rounded-2xl bg-charcoal/80 px-4 py-3 text-stone/90">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
