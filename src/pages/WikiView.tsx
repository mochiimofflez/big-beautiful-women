import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { ArticleList } from '../components/ArticleList';
import { ProfileMenu } from '../components/ProfileMenu';
import { CollageArticle } from '../components/CollageArticle';
import { CanvasView } from '../components/CanvasView';
import { MapView } from '../components/MapView';
import { Settings } from '../components/Settings';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useCampaign } from '../hooks/useCampaign';
import { ArticleData, ArticleBlock } from '../types';
import { NotFoundCampaignPage } from './NotFoundCampaignPage';

export function WikiView() {
  useAuthGuard();
  const { campaignId, articleId: routeArticleId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const campaignManager = useCampaign(auth.user?.username);

  const [query, setQuery] = useState('');
  const [isPlayerView, setIsPlayerView] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'articles' | 'notes'>('articles');
  const [dragMode, setDragMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState<ArticleData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Tab & View State
  const [openTabIds, setOpenTabIds] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'collage' | 'canvas' | 'map'>('collage');
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({ disableAnimations: false });

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
        
        if (query) {
            const q = query.toLowerCase();
            filtered = filtered.filter(a => 
                a.title.toLowerCase().includes(q) || 
                a.summary.toLowerCase().includes(q) ||
                (a.properties?.['Alias'] && a.properties['Alias'].toLowerCase().includes(q))
            );
        }

        return filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());       
    },
    [campaignArticles, auth.user, currentCampaign, isPlayerView, query]
  );

  const activeArticle = useMemo(
    () => visibleArticles.find((a) => a.id === activeTabId) || null,
    [visibleArticles, activeTabId]
  );

  useEffect(() => {
    if (routeArticleId && !openTabIds.includes(routeArticleId)) {
        setOpenTabIds(prev => [...prev, routeArticleId]);
        setActiveTabId(routeArticleId);
    }
  }, [routeArticleId]);

  const closeTab = (id: string) => {
    const newTabs = openTabIds.filter(tid => tid !== id);
    setOpenTabIds(newTabs);
    if (activeTabId === id) {
        setActiveTabId(newTabs[newTabs.length - 1] || null);
    }
  };

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

  const handleCreateDraft = async () => {
    if (!campaignId) return;
    const draft = await campaignManager.createArticle(campaignId, {
        title: 'New Article',
        status: 'draft',
        hidden: true,
        author: auth.user?.username || 'Unknown'
    });
    if (draft) {
        setOpenTabIds(prev => [...prev, draft.id]);
        setActiveTabId(draft.id);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!e.ctrlKey) return;
        if (e.key === 'z') {
            e.preventDefault();
            if (historyIndex > 0 && activeArticle) {
                setHistoryIndex(historyIndex - 1);
                campaignManager.updateArticle(history[historyIndex - 1]);
            }
        } else if (e.key === 'r') {
            e.preventDefault();
            if (historyIndex < history.length - 1 && activeArticle) {
                setHistoryIndex(historyIndex + 1);
                campaignManager.updateArticle(history[historyIndex + 1]);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex, campaignManager, activeArticle]);

  if (!currentCampaign) return <NotFoundCampaignPage />;

  return (
    <div className={`flex h-screen bg-charcoal text-stone ${globalSettings.disableAnimations ? 'no-animations' : ''}`} style={(activeArticle?.backgroundUrl || currentCampaign?.backgroundUrl) ? { backgroundImage: `url(${activeArticle?.backgroundUrl || currentCampaign?.backgroundUrl})`, backgroundSize: 'cover' } : {}}>
      <Settings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={globalSettings}
        onUpdate={setGlobalSettings}
      />
      
      {isSidebarOpen && (
        <aside className='shrink-0 border-r border-brass/10 bg-[#101010]/90 backdrop-blur-md p-6 w-[320px] overflow-y-auto no-scrollbar'>        
            <div className='flex justify-between mb-6'>
                <Link to='/Library' className='text-xs uppercase tracking-[0.35em] text-brass/70'>Explorer</Link> 
                <button onClick={() => setIsSidebarOpen(false)} className='text-brass'>✕</button>
            </div>

            <h1 className='text-2xl font-semibold text-amber-200 mb-6'>{currentCampaign.title}</h1>

            <div className='flex gap-4 mb-4'>
                <button onClick={() => setActiveSidebarTab('articles')} className={activeSidebarTab === 'articles' ? 'text-brass' : 'text-stone'}>Files</button>
                <button onClick={() => setActiveSidebarTab('notes')} className={activeSidebarTab === 'notes' ? 'text-brass' : 'text-stone'}>Notes</button>
            </div>

            {canManage && (
                <div className='mb-6 border-t border-brass/10 pt-4'>
                    <div className='space-y-2'>
                        <button onClick={handleCreateDraft} className='w-full text-xs text-brass border border-brass/20 p-2 rounded'>+ New File</button>
                        <button onClick={() => setIsPlayerView(!isPlayerView)} className='w-full text-xs text-stone border border-stone/20 p-2 rounded'>{isPlayerView ? 'GM View' : 'Player View'}</button>
                    </div>
                </div>
            )}

            {activeSidebarTab === 'articles' ? (
                <div className='space-y-4'>
                    <SearchBar query={query} onSearch={setQuery} />
                    <ArticleList
                        articles={visibleArticles}
                        folders={campaignManager.getFoldersForCampaign(currentCampaign.id)}
                        activeArticleId={activeTabId}
                        query={query}
                        canManage={canManage && !isPlayerView}
                        onSelect={(id) => {
                            if (!openTabIds.includes(id)) setOpenTabIds(prev => [...prev, id]);
                            setActiveTabId(id);
                        }}
                        onEdit={(a) => {
                             if (!openTabIds.includes(a.id)) setOpenTabIds(prev => [...prev, a.id]);
                             setActiveTabId(a.id);
                        }}
                        onDelete={campaignManager.deleteArticle}
                        onToggleHidden={campaignManager.toggleHidden}
                        onCreateFolder={(name) => campaignManager.createFolder(currentCampaign.id, name)}
                    />
                </div>
            ) : (
                <div className='text-sm p-4 border border-brass/10 rounded-2xl bg-charcoal/40 backdrop-blur-sm'>
                    <div>Campaign Log</div>
                </div>
            )}
        </aside>
      )}

      <main className='flex-1 flex flex-col min-w-0'>
        {/* Tab Bar */}
        <div className='flex items-center bg-[#0a0a0a]/80 backdrop-blur-md border-b border-brass/10 px-4 h-12 gap-1 overflow-x-auto no-scrollbar'>
            {openTabIds.map(tid => {
                const art = visibleArticles.find(a => a.id === tid);
                if (!art) return null;
                return (
                    <div 
                        key={tid} 
                        onClick={() => setActiveTabId(tid)}
                        className={`flex items-center gap-2 px-4 h-10 rounded-t-lg border-x border-t border-brass/5 transition cursor-pointer min-w-[120px] max-w-[200px] ${activeTabId === tid ? 'bg-charcoal/60 text-amber-200 border-brass/20' : 'text-stone/60 hover:bg-brass/5'}`}
                    >
                        <span className='text-xs truncate flex-1 font-medium'>{art.title}</span>
                        <button onClick={(e) => { e.stopPropagation(); closeTab(tid); }} className='hover:text-red-400'>✕</button>
                    </div>
                );
            })}
        </div>

        <div className='flex-1 p-10 overflow-y-auto relative no-scrollbar'>
            <div className='absolute top-6 right-6 z-[100] flex gap-4 items-center'>
                <button onClick={() => setIsSettingsOpen(true)} className='text-stone/40 hover:text-brass transition-colors'>⚙️</button>
                {auth.user && <ProfileMenu />}
            </div>
            {!isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(true)} className='fixed top-14 left-6 text-brass text-2xl z-10'>☰</button>
            )}
            
            {activeArticle && canManage && !isPlayerView && (
                <div className='flex gap-2 mb-4'>
                    <div className='flex bg-charcoal/40 backdrop-blur-md border border-brass/10 rounded-full p-1 mr-4'>
                        <button 
                            onClick={() => setCurrentView('collage')}
                            className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${currentView === 'collage' ? 'bg-brass text-charcoal shadow-lg' : 'text-stone/40 hover:text-stone'}`}
                        >
                            Collage
                        </button>
                        <button 
                            onClick={() => setCurrentView('canvas')}
                            className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${currentView === 'canvas' ? 'bg-brass text-charcoal shadow-lg' : 'text-stone/40 hover:text-stone'}`}
                        >
                            Canvas
                        </button>
                        <button 
                            onClick={() => setCurrentView('map')}
                            className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${currentView === 'map' ? 'bg-brass text-charcoal shadow-lg' : 'text-stone/40 hover:text-stone'}`}
                        >
                            Map
                        </button>
                    </div>

                    <button onClick={() => setDragMode(!dragMode)} className={`p-2 rounded-full ${dragMode ? 'bg-amber-500/20 text-amber-500' : 'bg-brass/10 text-brass'}`}>
                        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'></path></svg>
                    </button>
                    <button 
                        onClick={() => navigate(`/Campaigns/${campaignId}/editor/${activeArticle.id}`)}
                        className='bg-brass/10 text-brass px-4 py-2 rounded-full text-xs font-semibold hover:bg-brass/20 transition-colors'
                    >
                        Edit Archive
                    </button>
                </div>
            )}

            <div className='h-[calc(100vh-180px)]'>
                {activeArticle ? (
                    <div className='animate-in fade-in slide-in-from-bottom-4 duration-500 h-full'>
                        {currentView === 'collage' && (
                            <CollageArticle 
                                blocks={activeArticle.body} 
                                onUpdatePosition={handleUpdateBlockPosition} 
                                onAddBlock={handleAddBlock} 
                                mode={dragMode ? 'edit' : 'view'} 
                            />
                        )}
                        {currentView === 'canvas' && (
                            <CanvasView 
                                articles={visibleArticles}
                                onSelectArticle={(id) => {
                                    if (!openTabIds.includes(id)) setOpenTabIds(prev => [...prev, id]);
                                    setActiveTabId(id);
                                    setCurrentView('collage');
                                }}
                            />
                        )}
                        {currentView === 'map' && (
                            <MapView 
                                campaignMapUrl={currentCampaign.backgroundUrl}
                                articles={visibleArticles}
                                onSelectArticle={(id) => {
                                    if (!openTabIds.includes(id)) setOpenTabIds(prev => [...prev, id]);
                                    setActiveTabId(id);
                                    setCurrentView('collage');
                                }}
                            />
                        )}
                    </div>
                ) : (
                    <div className='h-full flex flex-col items-center justify-center text-stone/30 space-y-4'>
                        <div className='text-6xl font-display opacity-20'>Grand Library</div>
                        <p className='text-sm italic tracking-widest uppercase'>Select a record from the archives to begin exploration.</p>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
