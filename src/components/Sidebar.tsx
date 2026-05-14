import type { WikiSection } from '../types';

type SidebarProps = {
  sections: WikiSection[];
  activeSection: string;
  onSelect: (id: string) => void;
  canViewLocked: boolean;
  onUnlockWiki: (wikiId: string) => void;
  inviteCode: string;
  generateInviteCode: (wikiId: string) => string;
};

export function Sidebar({ sections, activeSection, onSelect, canViewLocked, onUnlockWiki, inviteCode, generateInviteCode }: SidebarProps) {
  return (
    <div className="space-y-6 rounded-3xl border border-brass/10 bg-[#0d0b0b] p-6 shadow-library">
      <div className="mb-6">
        <div className="mb-2 text-xs uppercase tracking-[0.35em] text-brass/70">Navigation</div>
        <div className="divide-y divide-brass/10 rounded-3xl border border-brass/5 bg-charcoal/90">
          {sections.map((section) => {
            const locked = section.locked && !canViewLocked;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelect(section.label)}
                className={`flex w-full items-center justify-between border-0 bg-transparent px-4 py-4 text-left transition ${
                  activeSection === section.label ? 'bg-brass/10 text-amber-200' : 'text-stone/80 hover:bg-brass/5'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium">{section.label}</span>
                  {locked && <span className="rounded-full bg-red-800/50 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-red-300">locked</span>}
                </span>
                <span className="text-[11px] text-stone/60">{section.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-brass/10 bg-soot/80 p-5">
        <div className="mb-3 text-xs uppercase tracking-[0.35em] text-brass/70">Locked Access</div>
        <p className="mb-4 text-sm leading-7 text-stone/70">
          Gate certain wikis behind GM-issued invite keys to preserve hidden story arcs and restricted lore.
        </p>
        <button
          type="button"
          className="w-full rounded-2xl border border-brass/20 bg-brass/10 px-4 py-3 text-sm text-brass transition hover:bg-brass/20"
          onClick={() => generateInviteCode('iron-court')}
        >
          Create GM Invite Code
        </button>
      </div>

      {inviteCode ? (
        <div className="rounded-3xl border border-brass/10 bg-[#111] p-4 text-sm text-stone/80">
          <div className="mb-2 text-xs uppercase tracking-[0.35em] text-brass/70">Current Invite</div>
          <p className="break-all rounded-2xl bg-[#0c0b0b] px-4 py-3 text-amber-100">{inviteCode}</p>
        </div>
      ) : null}
    </div>
  );
}
