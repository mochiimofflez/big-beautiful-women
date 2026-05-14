<<<<<<< HEAD
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { Infobox } from './components/Infobox';
import { ArticleList } from './components/ArticleList';
import { SessionModal } from './components/SessionModal';
import { ArticleEditor } from './components/ArticleEditor';
import { LandingPage } from './components/LandingPage';
import { AdminPanel } from './components/AdminPanel';
import { useAuth } from './hooks/useAuth';
import { useCampaign } from './hooks/useCampaign';
import { useSessionTimer } from './hooks/useSessionTimer';
import type { ArticleData } from './types';

function App() {
  const { campaignSlug, articleSlug } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  console.log("App render diagnostics:", { authed: !!auth.user, loading: auth.loading, slug: campaignSlug });
  
  // Wait for loading to complete
  if (auth.loading) {
    return <div className="min-h-screen bg-[#0d0b0b] flex items-center justify-center text-stone">Initializing Archive...</div>;
  }

  // If not authed, show LandingPage
  if (!auth.user) {
    return <LandingPage />;
  }

  // --- Logic for authenticated session ---
  const session = useSessionTimer();
  const campaignManager = useCampaign(auth.user.username);
  
  const [activeSection, setActiveSection] = useState('All');
  const [query, setQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorArticle, setEditorArticle] = useState<ArticleData | null>(null);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');

  // Find current campaign and its articles
  const currentCampaign = useMemo(() => 
    campaignSlug ? campaignManager.getCampaignBySlug(campaignSlug) : null
  , [campaignSlug, campaignManager.campaigns]);

  const campaignArticles = useMemo(() => 
    currentCampaign ? campaignManager.getArticlesForCampaign(currentCampaign.id) : []
  , [currentCampaign, campaignManager.articles]);

  const visibleArticles = useMemo(
    () => campaignArticles.filter((article) => !article.hidden || auth.isGM),
    [campaignArticles, auth.isGM]
  );

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

  const activeArticle = useMemo(
    () => filteredArticles.find((article) => article.slug === articleSlug) || filteredArticles[0] || null,
    [filteredArticles, articleSlug]
  );

  const handleSelectArticle = (id: string) => {
    const art = visibleArticles.find(a => a.id === id);
    if (art && currentCampaign) {
      navigate(`/${currentCampaign.slug}/${art.slug}`);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newC = await campaignManager.createCampaign(newCampaignTitle, newCampaignDesc);
      if (newC) {
        setNewCampaignTitle('');
        setNewCampaignDesc('');
        navigate(`/${newC.slug}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditor = (article?: ArticleData | null) => {
    setEditorArticle(article ?? null);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorArticle(null);
    setEditorOpen(false);
  };

  const handleSaveArticle = async (article: ArticleData) => {
    if (!currentCampaign) return;
    if (editorArticle) {
      await campaignManager.updateArticle(article);
    } else {
      await campaignManager.createArticle(currentCampaign.id, article);
    }
    navigate(`/${currentCampaign.slug}/${article.slug}`);
  };

  const canManage = auth.user?.role === 'gm';

  // --- Render logic for Campaign Hub (Home) ---
  if (!campaignSlug) {
    return (
      <div className="min-h-screen bg-charcoal text-stone p-10">
        <div className="mx-auto max-w-[1200px] space-y-12">
          <header className="text-center space-y-4">
            <div className="text-xs uppercase tracking-[0.4em] text-brass/70">Grand Library Archive</div>
            <h1 className="font-display text-5xl font-semibold text-amber-200">Worldbuilding Repository</h1>
            <p className="text-stone/70 max-w-2xl mx-auto">Select a campaign wiki to explore or create a new archive record. Limit 10 per profile.</p>
          </header>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="rounded-3xl border border-brass/10 bg-[#0d0b0b] p-8 shadow-library space-y-6">
              <h2 className="text-2xl font-display text-amber-100">Establish New Campaign</h2>
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <input
                  required
                  placeholder="Campaign Title"
                  value={newCampaignTitle}
                  onChange={(e) => setNewCampaignTitle(e.target.value)}
                  className="w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-stone outline-none focus:border-amber-400"
                />
                <textarea
                  required
                  placeholder="Campaign Description"
                  value={newCampaignDesc}
                  onChange={(e) => setNewCampaignDesc(e.target.value)}
                  className="w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-stone outline-none focus:border-amber-400 min-h-[100px]"
                />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-brass px-4 py-3 text-sm font-semibold uppercase tracking-widest text-charcoal transition hover:bg-amber-300"
                >
                  Initialize Archive
                </button>
              </form>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-display text-amber-100">Available Wikis</h2>
              <div className="space-y-4">
                {campaignManager.campaigns.length === 0 ? (
                  <p className="text-stone/50 italic">No campaigns found in the library records.</p>
                ) : (
                  campaignManager.campaigns.map(c => (
                    <Link
                      key={c.id}
                      to={`/${c.slug}`}
                      className="block group rounded-3xl border border-brass/5 bg-[#101010] p-6 hover:border-brass/30 transition-all shadow-md"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold text-amber-50 group-hover:text-amber-200 transition-colors">{c.title}</h3>
                        <span className="text-[10px] uppercase tracking-widest text-brass/40">By {c.owner}</span>
                      </div>
                      <p className="text-sm text-stone/70 line-clamp-2">{c.description}</p>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal text-stone">
      {session.showPrompt && <SessionModal onKeepSession={session.reset} />}
      <ArticleEditor 
        open={editorOpen} 
        article={editorArticle} 
        author={auth.user?.username ?? 'Unknown'} 
        onSave={handleSaveArticle} 
        onClose={closeEditor} 
      />

      {auth.isGM && adminPanelOpen && (
        <AdminPanel onClose={() => setAdminPanelOpen(false)} />
      )}

      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        {/* Navigation Sidebar */}
        <aside className="shrink-0 border-r border-brass/10 bg-[#101010] p-6 lg:w-[320px]">
          <Link to="/" className="block mb-8 rounded-3xl border border-brass/15 bg-[#0d0b0b] p-6 shadow-library hover:border-brass/40 transition-all">
            <div className="mb-4 text-xs uppercase tracking-[0.35em] text-brass/70">Grand Library</div>
            <h1 className="font-display text-2xl font-semibold text-amber-200 leading-tight">{currentCampaign?.title ?? 'Worldbuilding Wiki'}</h1>
            <p className="mt-3 text-xs leading-5 text-stone/80 italic">Click to return to Repository Hub</p>
          </Link>

          <SearchBar query={query} onSearch={setQuery} />

          <div className="mt-8 space-y-4">
            {auth.isGM && (
              <button
                onClick={() => setAdminPanelOpen(true)}
                className="w-full rounded-2xl border border-brass/30 bg-brass/20 px-4 py-3 text-xs uppercase tracking-widest text-brass transition hover:bg-brass/30"
              >
                Admin Panel
              </button>
            )}
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
                  <button
                    className="mt-4 w-full rounded-2xl border border-brass/30 bg-brass/10 px-4 py-2 text-sm text-brass transition hover:bg-brass/20"
                    onClick={auth.logout}
                  >
                    Logout
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
            <section className="space-y-8 rounded-3xl border border-brass/10 bg-[#0d0b0b] p-8 shadow-library">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brass/70">Archive Record</p>
                  <h2 className="mt-2 text-3xl font-semibold text-amber-100">{activeArticle?.title ?? 'No article selected'}</h2>
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
                  {activeArticle.body.map((block: any, i: number) => (
                    <div key={i} className="space-y-4">
                      <h3 className="text-xl font-semibold text-stone-100">{block.title || 'Untitled section'}</h3>
                      <p className="max-w-3xl leading-8 text-stone/70">{block.content}</p>
                    </div>
                  ))}
                </article>
              ) : (
                <div className="rounded-3xl border border-brass/10 bg-charcoal/80 p-6 text-sm text-stone/70">
                  Select an article from the campaign list to begin.
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <Infobox metadata={activeArticle?.infobox ?? []} />

              <ArticleList
                articles={filteredArticles}
                activeArticleId={activeArticle?.id ?? null}
                selectedSection={activeSection}
                query={query}
                canManage={canManage}
                onSelect={handleSelectArticle}
                onEdit={(article) => openEditor(article)}
                onDelete={campaignManager.deleteArticle}
                onToggleHidden={campaignManager.toggleHidden}
              />
            </aside>
          </div>
        </main>
      </div>
    </div>
=======
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { WikiView } from './pages/WikiView';
import { EditorPage } from './pages/EditorPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/Campaigns/:campaignId" element={<WikiView />} />
      <Route path="/Campaigns/:campaignId/:articleId" element={<WikiView />} />
      <Route path="/Campaigns/:campaignId/editor" element={<EditorPage />} />
      <Route path="/Campaigns/:campaignId/editor/:articleId" element={<EditorPage />} />
      <Route path="/Users/:userId" element={<ProfilePage />} />
      <Route path="/Admin" element={<AdminPage />} />
    </Routes>
>>>>>>> 888f09bc459faab80e3f1b5dfb833770d1d33677
  );
}
