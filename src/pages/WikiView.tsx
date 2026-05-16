import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { SearchBar } from '../components/SearchBar';
import { ArticleList } from '../components/ArticleList';
import { ProfileMenu } from '../components/ProfileMenu';
import { CollageArticle } from '../components/CollageArticle';
import { AuthFrame } from '../components/AuthFrame';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useCampaign } from '../hooks/useCampaign';
import { ArticleData, ArticleBlock } from '../types';
import { NotFoundArticlePage } from './NotFoundArticlePage';
import { NotFoundCampaignPage } from './NotFoundCampaignPage';

export function WikiView() {
  useAuthGuard();
  const { campaignId, articleSlug } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const campaignManager = useCampaign(auth.user?.username);

  const [query, setQuery] = useState('');
  const [isPlayerView, setIsPlayerView] = useState(false);
  const [activeTab, setActiveTab] = useState<'articles' | 'notes'>('articles');
  const [dragMode, setDragMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState<ArticleData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const currentCampaign = useMemo(() =>
    campaignId ? campaignManager.campaigns.find(c => c.id === campaignId) : null
  , [campaignId, campaignManager.campaigns]);

  const campaignArticles = useMemo(() =>
    currentCampaign ? campaignManager.getArticlesForCampaign(currentCampaign.id) : []
  , [currentCampaign, campaignManager.articles]);

  const visibleArticles = useMemo(
    () => {
        let filtered = campaignArticles.filter((a) => !a.hidden || (auth.user?.role === 'admin' || currentCampaign?.owner === auth.user?.username));
        if (isPlayerView) filtered = filtered.filter(a => !a.hidden);
        return filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());       
    },
    [campaignArticles, auth.user, currentCampaign, isPlayerView]
  );

  const activeArticle = useMemo(
    () => visibleArticles.find((a) => a.slug === articleSlug) || visibleArticles[0] || null,
    [visibleArticles, articleSlug]
  );

  const canManage = auth.user?.role === 'admin' || currentCampaign?.owner === auth.user?.username;

  const saveToHistory = useCallback((article: ArticleData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(article)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleUpdate = (updated: ArticleData) => {
      saveToHistory(updated);
      campaignManager.updateArticle(updated);
  };

  const handleUpdateBlockPosition = (index: number, x: number, y: number) => {
    if (!activeArticle) return;
    handleUpdate({
        ...activeArticle,
        body: activeArticle.body.map((b, i) => i === index ? { ...b, position: { x, y } } : b)
    });
  };

  const handleAddBlock = (block: ArticleBlock) => {
    if (!activeArticle) return;
    handleUpdate({ ...activeArticle, body: [...activeArticle.body, block] });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!e.ctrlKey) return;
        if (e.key === 'z') {
            e.preventDefault();
            if (historyIndex > 0) {
                setHistoryIndex(historyIndex - 1);
                campaignManager.updateArticle(history[historyIndex - 1]);
            }
        } else if (e.key === 'r') {
            e.preventDefault();
            if (historyIndex < history.length - 1) {
                setHistoryIndex(historyIndex + 1);
                campaignManager.updateArticle(history[historyIndex + 1]);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex, campaignManager]);

  if (!currentCampaign) return <NotFoundCampaignPage />;
  if (articleSlug && !activeArticle) return <NotFoundArticlePage />;

  return (
    <div className='flex h-screen bg-charcoal text-stone'>
      {isSidebarOpen && (
        <aside className='shrink-0 border-r border-brass/10 bg-[#101010] p-6 w-[320px] overflow-y-auto'>        
            <div className='flex justify-between mb-6'>
                <Link to='/Library' className='text-xs uppercase tracking-[0.35em] text-brass/70'>Grand Library</Link> 
                <button onClick={() => setIsSidebarOpen(false)} className='text-brass'>«</button>
            </div>

            <h1 className='text-2xl font-semibold text-amber-200 mb-6'>{currentCampaign.title}</h1>

            <div className='mb-8'>
                <h3 className='text-[10px] uppercase tracking-widest text-brass/50 mb-3'>My Campaigns</h3>      
                <div className='space-y-1'>
                    {campaignManager.invitedCampaigns.map(c => (
                        <Link key={c.id} to={`/Campaigns/${c.id}`} className='block text-sm text-stone hover:text-amber-200 p-1'>{c.title}</Link>
                    ))}
                </div>
            </div>

            <div className='flex gap-4 mb-4'>
                <button onClick={() => setActiveTab('articles')} className={activeTab === 'articles' ? 'text-brass' : 'text-stone'}>Recent Articles</button>
                <button onClick={() => setActiveTab('notes')} className={activeTab === 'notes' ? 'text-brass' : 'text-stone'}>Notes</button>
            </div>

            {canManage && (
                <div className='mb-6 border-t border-brass/10 pt-4'>
                    <h3 className='text-[10px] uppercase tracking-widest text-brass/50 mb-3'>Campaign Management</h3>
                    <div className='space-y-2'>
                        <button onClick={() => setIsPlayerView(!isPlayerView)} className='w-full text-xs text-stone border border-stone/20 p-2 rounded'>{isPlayerView ? 'Return to GM' : 'Player Mode'}</button>
                        <button onClick={() => navigate(`/Campaigns/${campaignId}/editor`)} className='w-full text-xs text-brass border border-brass/20 p-2 rounded'>Create Article</button>
                        <button onClick={() => alert(`Campaign Invite: ${auth.generateInviteCode(campaignId!)}`)} className='w-full text-xs text-brass border border-brass/20 p-2 rounded'>Generate Invite</button>
                    </div>
                </div>
            )}

            {activeTab === 'articles' ? (
                <div className='space-y-4'>
                    <SearchBar query={query} onSearch={setQuery} />
                    <ArticleList
                        articles={visibleArticles}
                        activeArticleId={activeArticle?.id ?? null}
                        selectedSection='All'
                        query={query}
                        canManage={canManage && !isPlayerView}
                        onSelect={(id) => navigate(`/Campaigns/${campaignId}/${visibleArticles.find(a => a.id === id)?.slug}`)}
                        onEdit={(a) => navigate(`/Campaigns/${campaignId}/editor/${a.id}`)}
                        onDelete={campaignManager.deleteArticle}
                        onToggleHidden={campaignManager.toggleHidden}
                    />
                </div>
            ) : (
                <div className='text-sm p-4 border border-brass/10 rounded-2xl space-y-4'>
                    <div>Shared Campaign Notes</div>
                </div>
            )}
        </aside>
      )}

      <main className='flex-1 p-10 overflow-y-auto'>
        <div className='absolute top-6 right-6 z-50'>
            {auth.user && <ProfileMenu />}
        </div>
        {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className='fixed top-10 left-6 text-brass text-2xl z-10'>»</button>
        )}
        {canManage && !isPlayerView && (
             <button onClick={() => setDragMode(!dragMode)} className={`mb-4 p-2 rounded-full ${dragMode ? 'bg-amber-500/20 text-amber-500' : 'bg-brass/10 text-brass'}`}>
                <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'></path></svg>
             </button>
        )}
        {activeArticle ? (
            <CollageArticle blocks={activeArticle.body} onUpdatePosition={handleUpdateBlockPosition} onAddBlock={handleAddBlock} mode={dragMode ? 'edit' : 'view'} />
        ) : (
            <div>Select an article</div>
        )}
      </main>
    </div>
  );
}
