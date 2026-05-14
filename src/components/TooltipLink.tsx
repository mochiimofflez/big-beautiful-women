import type { SourceLink } from '../types';

type TooltipLinkProps = SourceLink;

export function TooltipLink({ label, tooltip, href, type }: TooltipLinkProps) {
  return (
    <a
      href={href}
      className="group relative block overflow-hidden rounded-3xl border border-brass/10 bg-[#121010] p-5 text-left transition hover:border-amber-300 hover:bg-[#181616]"
      title={tooltip}
    >
      <div className="mb-2 text-[10px] uppercase tracking-[0.35em] text-brass/70">{type}</div>
      <div className="text-sm font-semibold text-stone-100">{label}</div>
      <div className="mt-3 text-sm leading-6 text-stone/70 opacity-0 transition duration-200 group-hover:opacity-100">
        {tooltip}
      </div>
    </a>
  );
}
