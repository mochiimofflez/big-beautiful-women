import type { SourceLink } from '../types';

type TooltipLinkProps = SourceLink;

/**
 * A rich interactive link used within article content or as a source reference.
 * 
 * Instead of a simple text link, this component provides a card-like interface
 * that reveals a tooltip/description when hovered. This helps maintain immersion
 * by providing "quick lore" without forcing a full page navigation.
 * 
 * @param props.label The visible name of the link (e.g., "The Silver Forest")
 * @param props.tooltip The "quick lore" or snippet revealed on hover
 * @param props.href The destination article slug or external URL
 * @param props.type Categorization of the entity (e.g., "Location", "Person")
 */
export function TooltipLink({ label, tooltip, href, type }: TooltipLinkProps) {
  return (
    <a
      href={href}
      className="group relative block overflow-hidden rounded-3xl border border-brass/10 bg-[#121010] p-5 text-left transition hover:border-amber-300 hover:bg-[#181616]"
      title={tooltip}
    >
      {/* Category header for the linked entity */}
      <div className="mb-2 text-[10px] uppercase tracking-[0.35em] text-brass/70">{type}</div>
      
      {/* Entity label */}
      <div className="text-sm font-semibold text-stone-100">{label}</div>
      
      {/* Tooltip content: Revealed on hover for additional context */}
      <div className="mt-3 text-sm leading-6 text-stone/70 opacity-0 transition duration-200 group-hover:opacity-100">
        {tooltip}
      </div>
    </a>
  );
}
