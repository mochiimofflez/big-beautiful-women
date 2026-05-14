import type { WikiSection } from '../types';

type SidebarProps = {
  /** All available wiki sections to display in navigation */
  sections: WikiSection[];
  /** The currently selected section label */
  activeSection: string;
  /** Callback triggered when a section is clicked */
  onSelect: (id: string) => void;
  /** Whether the current user has permission to see 'locked' sections */
  canViewLocked: boolean;
  /** Callback to initiate the wiki unlocking process */
  onUnlockWiki: (wikiId: string) => void;
  /** The most recently generated GM invite code */
  inviteCode: string;
  /** Function to generate a new invite code for a specific section */
  generateInviteCode: (wikiId: string) => string;
};

/**
 * The primary navigation component for the wiki.
 * 
 * Features:
 * - Dynamic list of wiki sections with article counts.
 * - Visual "locked" indicators for restricted lore.
 * - GM-only tools for generating invite codes to share with players.
 */
export function Sidebar({ sections, activeSection, onSelect, canViewLocked, onUnlockWiki, inviteCode, generateInviteCode }: SidebarProps) {
  return (
    <div className="space-y-6 rounded-3xl border border-brass/10 bg-[#0d0b0b] p-6 shadow-library">
      {/* Main Navigation Section */}
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
                  {/* Status indicator for locked content */}
                  {locked && (
                    <span className="rounded-full bg-red-800/50 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-red-300">
                      locked
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-stone/60">{section.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Display for the active invite code (Visible to GMs to share with players) */}
      {inviteCode ? (
        <div className="rounded-3xl border border-brass/10 bg-[#111] p-4 text-sm text-stone/80">
          <div className="mb-2 text-xs uppercase tracking-[0.35em] text-brass/70">Current Invite</div>
          <p className="break-all rounded-2xl bg-[#0c0b0b] px-4 py-3 text-amber-100">
            {inviteCode}
          </p>
        </div>
      ) : null}
    </div>
  );
}
