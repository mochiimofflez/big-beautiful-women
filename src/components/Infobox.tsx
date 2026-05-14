import type { InfoboxItem } from '../types';

type InfoboxProps = {
  /** Array of key-value pairs to display as quick facts */
  metadata: InfoboxItem[];
};

/**
 * A sidebar component for wiki articles that displays structured metadata.
 * 
 * Styled to look like a high-tech or magical ledger entry, it provides
 * glanceable information like "Age", "Status", or "Location".
 */
export function Infobox({ metadata }: InfoboxProps) {
  return (
    <div className="rounded-3xl border border-brass/10 bg-[#0d0b0b] p-6 shadow-library">
      {/* Diegetic Label: Frames the component within the world's documentation system */}
      <div className="mb-4 text-xs uppercase tracking-[0.35em] text-brass/70">Infobox</div>
      
      <div className="space-y-4">
        {metadata.map((item) => (
          <div key={item.label} className="grid gap-2 text-sm">
            {/* The attribute label (e.g., "Origin") */}
            <div className="text-[11px] uppercase tracking-[0.3em] text-stone/50">{item.label}</div>
            
            {/* The attribute value (e.g., "Eldoria") */}
            <div className="rounded-2xl bg-charcoal/80 px-4 py-3 text-stone/90">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
