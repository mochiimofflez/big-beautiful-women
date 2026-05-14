import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { Infobox } from './components/Infobox';
import { TooltipLink } from './components/TooltipLink';
import { ArticleList } from './components/ArticleList';
import { ArticleEditor } from './components/ArticleEditor';
import { useAuth } from './hooks/useAuth';
import { useCampaign } from './hooks/useCampaign';
import type { ArticleData } from './types';

/**
 * Main application shell for the Worldbuilding Wiki.
 * Orchestrates authentication, campaign data management, and the overall layout.
 */
function App() {
  // Authentication hook for user roles (GM vs Reader) and invite gating
  const auth = useAuth();
  
  // Campaign management hook for article CRUD operations and persistence
  const campaign = useCampaign();
  
  // Local state for UI navigation and filtering
  const [activeSection, setActiveSection] = useState('All');
  const [query, setQuery] = useState('');
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  
  // Editor state for creating or modifying articles
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorArticle, setEditorArticle] = useState<ArticleData | null>(null);

  /**
   * Filter articles based on visibility permissions.
   * GMs can see hidden articles; Readers cannot.
   */
  const visibleArticles = useMemo(
    () => campaign.articles.filter((article) => !article.hidden || auth.isGM),
    [campaign.articles, auth.isGM]
  );

  /**
   * Generate section options for the sidebar based on available article types.
   */
  const sectionOptions = useMemo(() => {
    const counts = visibleArticles.reduce<Record<string, number>>((acc, article) => {
      acc[article.type] = (acc[article.type] || 0) + 1;
      return acc;
    }, {});

    return [
      { id: 'all', label: 'All', count: visibleArticles.length },
      ...Object.entries(counts).map(([type, count]) => ({ id: type, label: type, count })),
    ];
  }, [visibleArticles]);

  /**
   * Apply search query and section filters to the visible articles list.
   */
  const filteredArticles = useMemo(
    () =>
      visibleArticles.filter((article) => {
        const matchesSection = activeSection === 'All' || article.type === activeSection;
        const matchesQuery = [article.title, article.summary, article.type].some((value) =>
          value.toLowerCase().includes(query.toLowerCase())
        );
        return matchesSection && matchesQuery;
      }),
    [visibleArticles, activeSection, query]
  );

  /**
   * Determine the currently active article for display in the main panel.
   */
  const activeArticle = useMemo(
    () => filteredArticles.find((article) => article.id === activeArticleId) || filteredArticles[0] || null,
    [filteredArticles, activeArticleId]
  );

  /**
   * Sync active article ID when filters change or when the initial load occurs.
   */
  useEffect(() => {
    if (!activeArticleId && filteredArticles.length) {
      setActiveArticleId(filteredArticles[0].id);
    }
    if (activeArticleId && !filteredArticles.some((article) => article.id === activeArticleId)) {
      setActiveArticleId(filteredArticles[0]?.id ?? null);
    }
  }, [filteredArticles, activeArticleId]);

  /**
   * Open the article editor for either a new article or an existing one.
   */
  const openEditor = (article?: ArticleData | null) => {
    setEditorArticle(article ?? null);
    setEditorOpen(true);
  };

  /**
   * Close the editor and reset the targeted article state.
   */
  const closeEditor = () => {
    setEditorArticle(null);
    setEditorOpen(false);
  };

  /**
   * Persist changes from the editor to the campaign state.
   */
  const handleSaveArticle = (article: ArticleData) => {
    if (editorArticle) {
      campaign.updateArticle(article);
    } else {
      campaign.createArticle(article);
    }
    setActiveArticleId(article.id);
  };

  // Helper flag for rendering management-only UI elements
  const canManage = auth.user?.role === 'gm';

  return (
    <div className="min-h-screen bg-charcoal text-stone">
      {/* Diegetic Article Editor Overlay */}
      <ArticleEditor 
        open={editorOpen} 
        article={editorArticle} 
        author={auth.user?.username ?? 'Unknown'} 
        onSave={handleSaveArticle} 
        onClose={closeEditor} 
      />

      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        {/* Navigation Sidebar: Branding, Search, and Auth */}
        <aside className="shrink-0 border-r border-brass/10 bg-[#101010] p-6 lg:w-[320px]">
          {/* Main Branding Block */}
          <div className="mb-8 rounded-3xl border border-brass/15 bg-[#0d0b0b] p-6 shadow-library">
            <div className="mb-4 text-xs uppercase tracking-[0.35em] text-brass/70">Grand Library</div>
            <h1 className="font-display text-3xl font-semibold text-amber-200">Worldbuilding Wiki</h1>
            <p className="mt-3 text-sm leading-6 text-stone/80">
              A GM-managed campaign wiki with article creation, editing, deletion, and hidden lore control.
            </p>
          </div>

          <SearchBar query={query} onSearch={setQuery} />

          <div className="mt-8 space-y-4">
            <Sidebar
              sections={sectionOptions}
              activeSection={activeSection}
              onSelect={setActiveSection}
              canViewLocked={auth.unlockedWikis.includes('iron-court')}
              onUnlockWiki={auth.unlockWiki}
              inviteCode={auth.inviteCode}
              generateInviteCode={auth.generateInviteCode}
            />
          </div>

          {/* Session & User Identity Panel */}
          <div className="mt-8 rounded-3xl border border-brass/10 bg-[#0d0b0b] p-6 text-sm text-stone/80 shadow-library">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-brass/70">
              <span>Session</span>
              <span className="rounded-full border border-brass/20 bg-soot px-2 py-1 text-[10px] uppercase">
                {auth.user ? 'Logged In' : 'Guest'}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {auth.user ? (
                <>
                  <div className="text-sm font-semibold text-amber-200">{auth.user.username}</div>
                  <div className="text-xs uppercase tracking-[0.35em] text-brass/70">Role</div>
                  <p className="text-sm leading-6 text-stone/70">{auth.user.role === 'gm' ? 'Game Master' : 'Reader'}</p>
                  <button
                    className="mt-4 w-full rounded-2xl border border-brass/30 bg-brass/10 px-4 py-2 text-sm text-brass transition hover:bg-brass/20"
                    onClick={auth.logout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  className="w-full rounded-2xl border border-brass/30 bg-brass/10 px-4 py-2 text-sm text-brass transition hover:bg-brass/20"
                  onClick={auth.toggleLoginForm}
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>

          {/* Login/Registration Form Toggle */}
          {auth.showLogin && (
            <div className="mt-6 rounded-3xl border border-brass/10 bg-[#0d0b0b] p-6 shadow-library">
              <div className="mb-4 text-xs uppercase tracking-[0.35em] text-brass/70">Access Control</div>
              <p className="mb-4 text-[11px] text-stone/60 uppercase tracking-widest leading-relaxed">
                Registration requires a valid GM-issued access key.
              </p>
              <div className="space-y-4">
                <input
                  value={auth.username}
                  onChange={(event) => auth.setUsername(event.target.value)}
                  placeholder="Handle"
                  className="w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-sm text-stone outline-none focus:border-amber-400"
                />
                <input
                  type="password"
                  value={auth.password}
                  onChange={(event) => auth.setPassword(event.target.value)}
                  placeholder="Secret phrase"
                  className="w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-sm text-stone outline-none focus:border-amber-400"
                />
                <input
                  value={auth.inviteInput}
                  onChange={(event) => auth.setInviteInput(event.target.value)}
                  placeholder="Access Key (Required for new profiles)"
                  className="w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-sm text-stone outline-none focus:border-amber-400"
                />
                {auth.authMessage && <p className="text-[11px] text-red-400">{auth.authMessage}</p>}
                <button
                  className="w-full rounded-2xl bg-brass px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-charcoal transition hover:bg-amber-300"
                  onClick={auth.handleLogin}
                >
                  Unlock the Archive
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area: Article Display and Contextual Panels */}
        <main className="flex-1 p-6 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
            {/* Active Article Viewer */}
            <section className="space-y-8 rounded-3xl border border-brass/10 bg-[#0d0b0b] p-8 shadow-library">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brass/70">Campaign Article</p>
                  <h2 className="mt-2 text-3xl font-semibold text-amber-100">{activeArticle?.title ?? 'No article selected'}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-stone/70">
                    {activeArticle?.summary ?? 'Use the manager to create or select an article to display here.'}
                  </p>
                </div>
                {canManage ? (
                  <button
                    className="rounded-2xl border border-brass/20 bg-brass/10 px-4 py-3 text-sm text-brass transition hover:bg-brass/20"
                    onClick={() => openEditor(null)}
                  >
                    Create Article
                  </button>
                ) : null}
              </div>

              {activeArticle ? (
                <article className="space-y-8">
                  {activeArticle.body.map((block) => (
                    <div key={block.title} className="space-y-4">
                      <h3 className="text-xl font-semibold text-stone-100">{block.title || 'Untitled section'}</h3>
                      <p className="max-w-3xl leading-8 text-stone/70">{block.content}</p>
                    </div>
                  ))}
                </article>
              ) : (
                <div className="rounded-3xl border border-brass/10 bg-charcoal/80 p-6 text-sm text-stone/70">
                  Explore your campaign list or create your first article to begin worldbuilding.
                </div>
              )}
            </section>

            {/* Contextual Sidebar: Metadata Infobox and Archive Gating */}
            <aside className="space-y-6">
              {/* Infobox for quick facts/metadata */}
              <Infobox metadata={activeArticle?.infobox ?? []} />

              {/* Archive Locking System (Invite Code Gating) */}
              <div className="rounded-3xl border border-brass/10 bg-[#0d0b0b] p-6 shadow-library">
                <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.35em] text-brass/70">
                  <span>Locked Archive</span>
                  <span className="text-[10px] uppercase text-stone/60">
                    {auth.unlockedWikis.includes('iron-court') ? 'accessible' : 'sealed'}
                  </span>
                </div>
                <div className="rounded-3xl border border-brass/10 bg-charcoal/90 p-4 text-sm text-stone/70">
                  <p className="mb-3">The GM can generate an invite code to grant access to hidden wikis in this world.</p>
                  <div className="grid gap-3">
                    {auth.isGM && (
                      <button
                        className="rounded-2xl border border-brass/20 bg-brass/10 px-4 py-3 text-sm text-brass transition hover:bg-brass/20"
                        onClick={() => auth.generateInviteCode('iron-court')}
                      >
                        Generate Invite Code
                      </button>
                    )}
                    <input
                      className="rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-sm text-stone outline-none focus:border-amber-400"
                      placeholder="Enter invite code"
                      value={auth.inviteInput}
                      onChange={(event) => auth.setInviteInput(event.target.value)}
                    />
                    <button
                      className="rounded-2xl border border-brass/20 bg-amber-700/10 px-4 py-3 text-sm text-amber-100 transition hover:bg-amber-700/20"
                      onClick={() => auth.unlockWiki('iron-court')}
                    >
                      Unlock The Iron Court
                    </button>
                    {auth.inviteMessage && <p className="text-[11px] text-amber-200">{auth.inviteMessage}</p>}
                  </div>
                </div>
              </div>

              {/* Management List of all visible/accessible articles */}
              <ArticleList
                articles={visibleArticles}
                activeArticleId={activeArticle?.id ?? null}
                selectedSection={activeSection}
                query={query}
                canManage={canManage}
                onSelect={(id) => setActiveArticleId(id)}
                onEdit={(article) => openEditor(article)}
                onDelete={campaign.deleteArticle}
                onToggleHidden={campaign.toggleHidden}
              />
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
