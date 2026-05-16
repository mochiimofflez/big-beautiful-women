import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { SearchBar } from '../components/SearchBar';
import { ArticleList } from '../components/ArticleList';
import { ProfileMenu } from '../components/ProfileMenu';
import { ArticleEditor } from '../components/ArticleEditor';
import { CollageArticle } from '../components/CollageArticle';
import { CanvasView } from '../components/CanvasView';
import { MapView } from '../components/MapView';
import { Settings } from '../components/Settings';
import { MediaLibrary } from '../components/MediaLibrary';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useCampaign } from '../hooks/useCampaign';
import { ArticleData, ArticleBlock, ArticleElement } from '../types';
import { NotFoundCampaignPage } from './NotFoundCampaignPage';

export function WikiView() {
  useAuthGuard();
  const { campaignId, articleId: routeArticleId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const campaignManager = useCampaign(auth.user?.username, auth.user?.role);

  const [query, setQuery] = useState('');
  const [isPlayerView, setIsPlayerView] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'articles' | 'notes'>('articles');
  const [dragMode, setDragMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState<ArticleData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleData | null>(null);

  // Tab & View State
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => 
    JSON.parse(localStorage.getItem(`wbw_tabs_${campaignId}`) || '[]')
  );
  const [activeTabId, setActiveTabId] = useState<string | null>(() => 
    localStorage.getItem(`wbw_active_tab_${campaignId}`)
  );

  useEffect(() => {
    localStorage.setItem(`wbw_tabs_${campaignId}`, JSON.stringify(openTabIds));
    if (activeTabId) localStorage.setItem(`wbw_active_tab_${campaignId}`, activeTabId);
  }, [openTabIds, activeTabId, campaignId]);

  const [currentView, setCurrentView] = useState<'collage' | 'canvas' | 'map'>('collage');
  
  // Ambience State
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Media Library State
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);

  // Favorites State
  const [favorites, setFavorites] = useState<string[]>(() => 
    JSON.parse(localStorage.getItem('wbw_favorites') || '[]')
  );

  useEffect(() => {
    localStorage.setItem('wbw_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
      setFavorites(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
  };

  // Spatial Bookmarks State
  const [bookmarks, setBookmarks] = useState<{ id: string, x: number, y: number, articleId: string }[]>(() => 
    JSON.parse(localStorage.getItem('wbw_spatial_bookmarks') || '[]')
  );

  useEffect(() => {
    localStorage.setItem('wbw_spatial_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const handleAddBookmark = (x: number, y: number) => {
      if (!activeTabId) return;
      const newBookmark = { id: `bm-${Date.now()}`, x, y, articleId: activeTabId };
      setBookmarks(prev => [...prev, newBookmark]);
  };

  const jumpToBookmark = (bm: typeof bookmarks[0]) => {
      if (activeTabId !== bm.articleId) {
          setActiveTabId(bm.articleId);
          if (!openTabIds.includes(bm.articleId)) setOpenTabIds(prev => [...prev, bm.articleId]);
      }
      // Teleport logic: We'd need to find the element in the DOM and scroll to it
      setTimeout(() => {
          const container = document.querySelector('.article-scroll-container');
          if (container) {
              container.scrollTo({ top: bm.y - 100, left: bm.x - 100, behavior: 'smooth' });
          }
      }, 100);
  };

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
        let filtered = campaignArticles.filter((a: ArticleData) => !a.hidden || (auth.user?.role === 'admin' || currentCampaign?.owner === auth.user?.username));
        if (isPlayerView) filtered = filtered.filter((a: ArticleData) => !a.hidden);
        
        if (query) {
            const q = query.toLowerCase();
            filtered = filtered.filter((a: ArticleData) => 
                a.title.toLowerCase().includes(q) || 
                a.summary.toLowerCase().includes(q) ||
                (a.properties?.['Alias'] && a.properties['Alias'].toLowerCase().includes(q))
            );
        }

        return filtered.sort((a: ArticleData, b: ArticleData) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());       
    },
    [campaignArticles, auth.user, currentCampaign, isPlayerView, query]
  );

  const activeArticle = useMemo(
    () => visibleArticles.find((a: ArticleData) => a.id === activeTabId) || null,
    [visibleArticles, activeTabId]
  );

  useEffect(() => {
    if (activeTabId) {
      navigate(`/Campaigns/${campaignId}/${activeTabId}`, { replace: true });
    } else {
      navigate(`/Campaigns/${campaignId}`, { replace: true });
    }
  }, [activeTabId, campaignId, navigate]);

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

  const handleUpdateElementPosition = (elId: string, x: number, y: number) => {
    if (!activeArticle) return;
    const nextElements = (activeArticle.elements || []).map(el => 
        el.id === elId ? { ...el, position: { x, y } } : el
    );
    handleUpdate({ ...activeArticle, elements: nextElements });
  };

  const handleUpdateElementSize = (elId: string, width: number, height: number) => {
    if (!activeArticle) return;
    const nextElements = (activeArticle.elements || []).map(el => 
        el.id === elId ? { ...el, size: { width, height } } : el
    );
    handleUpdate({ ...activeArticle, elements: nextElements });
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

  const handleAddElement = (type: ArticleElement['type'], content?: string) => {
    if (!activeArticle) return;
    const newElement: ArticleElement = {
        id: `el-${Date.now()}`,
        type,
        content: content || (type === 'text' ? 'New text content...' : ''),
        position: { x: 100, y: 100 },
        size: { width: 300, height: 200 },
        visibility: 'all'
    };
    handleUpdate({
        ...activeArticle,
        elements: [...(activeArticle.elements || []), newElement]
    });
  };

  const handleExportPDF = async (articleId: string) => {
    const element = document.querySelector('.article-scroll-container') as HTMLElement;
    if (!element) return;

    try {
        const canvas = await html2canvas(element, {
            backgroundColor: '#0a0a0a',
            scale: 2,
            useCORS: true,
            logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'l' : 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${visibleArticles.find(a => a.id === articleId)?.title || 'article'}.pdf`);
    } catch (error) {
        console.error('PDF Export failed:', error);
    }
  };

  const handleImportFolder = async (folderId: string | null = null) => {
    if (!campaignId) return;
    const input = document.createElement('input');
    input.type = 'file';
    // @ts-ignore
    input.webkitdirectory = true;
    
    input.onchange = async (e: any) => {
        const files = Array.from(e.target.files) as File[];
        for (const file of files) {
            if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                const text = await file.text();
                const title = file.name.replace(/\.(txt|md)$/, '');
                await campaignManager.createArticle(campaignId, {
                    title,
                    body: [{ title: 'Imported Content', content: text }],
                    folderId,
                    status: 'published'
                });
            }
        }
    };
    input.click();
  };

  // Ambience Logic
  useEffect(() => {
    if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
    }
    
    const audio = audioRef.current;
    if (activeArticle?.ambienceUrl && !isMuted) {
        audio.src = activeArticle.ambienceUrl;
        audio.volume = 0;
        audio.play().catch(e => console.warn('Audio play failed:', e));
        
        // Fade in
        let vol = 0;
        const interval = setInterval(() => {
            vol = Math.min(1, vol + 0.05);
            audio.volume = vol;
            if (vol >= 1) clearInterval(interval);
        }, 100);
        return () => clearInterval(interval);
    } else {
        // Fade out
        let vol = audio.volume;
        const interval = setInterval(() => {
            vol = Math.max(0, vol - 0.05);
            audio.volume = vol;
            if (vol <= 0) {
                audio.pause();
                clearInterval(interval);
            }
        }, 100);
        return () => clearInterval(interval);
    }
  }, [activeArticle?.ambienceUrl, isMuted]);

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
                <div className='mb-6 border-t border-brass/10 pt-4 space-y-4'>
                    <div className='space-y-2'>
                        <button onClick={handleCreateDraft} className='w-full text-xs text-brass border border-brass/20 p-2 rounded hover:bg-brass/5 transition-colors font-bold uppercase tracking-wider'>+ New Article</button>
                        <button onClick={() => setIsPlayerView(!isPlayerView)} className='w-full text-xs text-stone border border-stone/20 p-2 rounded hover:bg-white/5 transition-colors uppercase tracking-wider'>{isPlayerView ? '👁️ Previewing as Player' : '🛠️ Managing as GM'}</button>
                    </div>

                    <div className='p-4 bg-charcoal/60 border border-brass/10 rounded-2xl'>
                        <div className='flex justify-between items-center mb-2'>
                            <div className='text-[9px] uppercase tracking-[0.2em] text-brass/50 font-bold'>Invite Code</div>
                            <button 
                                onClick={async () => {
                                    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                                    await campaignManager.updateCampaign({ ...currentCampaign, inviteCode: code });
                                }}
                                className='text-[9px] text-brass hover:underline uppercase'
                            >
                                Regenerate
                            </button>
                        </div>
                        <div className='bg-black/40 p-2 rounded-lg text-center'>
                            <code className='text-xs text-amber-200 font-mono tracking-widest'>{currentCampaign.inviteCode || 'No Code Generated'}</code>
                        </div>
                    </div>
                </div>
            )}

            <div className='mt-auto pt-6 space-y-6'>
                {favorites.length > 0 && (
                    <div>
                        <div className='text-[10px] uppercase tracking-widest text-brass/50 mb-4'>Favorites</div>
                        <div className='space-y-1'>
                            {favorites.map(fid => {
                                const art = visibleArticles.find(a => a.id === fid);
                                if (!art) return null;
                                return (
                                    <div key={fid} onClick={() => { setActiveTabId(fid); if (!openTabIds.includes(fid)) setOpenTabIds(prev => [...prev, fid]); }} className='text-xs p-2 hover:bg-brass/5 rounded cursor-pointer flex items-center gap-2 group text-stone/60 hover:text-amber-100'>
                                        <span className='opacity-40'>⭐</span>
                                        <span className='truncate flex-1'>{art.title}</span>
                                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(fid); }} className='opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity'>✕</button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div>
                    <div className='text-[10px] uppercase tracking-widest text-brass/50 mb-4'>My Bookmarks</div>
                    <div className='space-y-2'>
                        {bookmarks.map(bm => (
                            <div key={bm.id} onClick={() => jumpToBookmark(bm)} className='text-xs p-2 bg-brass/5 rounded hover:bg-brass/10 cursor-pointer flex justify-between group'>
                                <span>📍 {visibleArticles.find(a => a.id === bm.articleId)?.title || 'Unknown'}</span>
                                <button onClick={(e) => { e.stopPropagation(); setBookmarks(prev => prev.filter(b => b.id !== bm.id)); }} className='opacity-0 group-hover:opacity-100 hover:text-red-400'>✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {activeSidebarTab === 'articles' ? (
                <div className='space-y-4 mt-6'>
                    <div className='grid grid-cols-2 gap-2 mb-4'>
                        <button 
                            onClick={() => setCurrentView('canvas')}
                            className='p-3 bg-brass text-charcoal rounded-2xl font-display font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-amber-400 transition-all flex items-center justify-center gap-2'
                        >
                            <span>🕸️</span> Canvas
                        </button>
                        <button 
                            onClick={() => setIsMediaLibraryOpen(true)}
                            className='p-3 bg-brass/10 text-brass border border-brass/20 rounded-2xl font-display font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brass/20 transition-all flex items-center justify-center gap-2'
                        >
                            <span>🎞️</span> Assets
                        </button>
                    </div>
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
                             setEditingArticle(a);
                             setIsEditorOpen(true);
                        }}
                        onDelete={(id) => {
                            const isFolder = id.startsWith('folder-');
                            const type = isFolder ? 'folder' : 'article';
                            if (window.confirm(`Are you sure you want to move this ${type} to the trash?`)) {
                                if (isFolder) campaignManager.softDeleteFolder(id);
                                else campaignManager.softDeleteArticle(id);
                            }
                        }}
                        onRestoreArticle={campaignManager.restoreArticle}
                        onRestoreFolder={campaignManager.restoreFolder}
                        onMoveArticle={(articleId, folderId) => {
                            const article = campaignArticles.find(a => a.id === articleId);
                            if (article) {
                                campaignManager.updateArticle({ ...article, folderId });
                            }
                        }}
                        onRenameArticle={(id, title) => {
                            const article = campaignArticles.find(a => a.id === id);
                            if (article) campaignManager.updateArticle({ ...article, title });
                        }}
                        onRenameFolder={(id, name) => {
                            const folder = campaignManager.folders.find(f => f.id === id);
                            if (folder) campaignManager.updateFolder({ ...folder, name });
                        }}
                        onDuplicateArticle={async (article) => {
                            if (!campaignId) return;
                            await campaignManager.createArticle(campaignId, {
                                ...article,
                                id: undefined, // Let it generate a new one
                                title: `${article.title} (Copy)`,
                                slug: undefined,
                                createdAt: undefined,
                                updatedAt: undefined
                            });
                        }}
                        onExportPDF={handleExportPDF}
                        onImportFolder={handleImportFolder}
                        onToggleFavorite={toggleFavorite}
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

        <div className='flex-1 p-10 overflow-y-auto relative no-scrollbar article-scroll-container' onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
            const isBookmark = e.dataTransfer.getData('isBookmark');
            if (isBookmark) {
                const rect = e.currentTarget.getBoundingClientRect();
                handleAddBookmark(e.clientX - rect.left + e.currentTarget.scrollLeft, e.clientY - rect.top + e.currentTarget.scrollTop);
            }
        }}>
            <div className='absolute top-6 right-6 z-[100] flex gap-4 items-center'>
                <button 
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.setData('isBookmark', 'true');
                        e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className='w-10 h-10 flex items-center justify-center rounded-full bg-brass/10 border border-brass/20 text-brass hover:bg-brass/20 transition-all cursor-grab active:cursor-grabbing'
                    title="Drag to add a Spatial Bookmark"
                >
                    📍
                </button>
                <button onClick={() => setIsMuted(!isMuted)} className={`text-xl ${isMuted ? 'opacity-30' : 'text-brass'}`} title="Toggle Ambience">
                    {isMuted ? '🔇' : '🔊'}
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className='text-stone/40 hover:text-brass transition-colors text-xl'>⚙️</button>
                {auth.user && <ProfileMenu />}
            </div>
            {!isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(true)} className='fixed top-14 left-6 text-brass text-2xl z-10'>☰</button>
            )}
            
            {activeArticle && canManage && !isPlayerView && (
                <div className='flex gap-2 mb-4'>
                    {dragMode ? (
                        <div className="relative group">
                            <button 
                                className="bg-brass text-charcoal w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shadow-lg hover:bg-amber-400 transition-all"
                                title="Add Element"
                            >
                                +
                            </button>
                            <div className='absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-brass/20 rounded-2xl overflow-hidden shadow-2xl z-[100] opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all'>
                                <div className='p-2 text-[10px] uppercase tracking-widest text-brass/50 border-b border-brass/10'>Add Element</div>
                                <button onClick={() => handleAddElement('text')} className='w-full p-3 text-xs hover:bg-brass/10 text-left flex items-center gap-2 text-stone/80 hover:text-amber-100'><span>📄</span> Text Box</button>
                                <button onClick={() => handleAddElement('image')} className='w-full p-3 text-xs hover:bg-brass/10 text-left flex items-center gap-2 text-stone/80 hover:text-amber-100'><span>🖼️</span> Picture</button>
                                <button onClick={() => handleAddElement('recording')} className='w-full p-3 text-xs hover:bg-brass/10 text-left flex items-center gap-2 text-stone/80 hover:text-amber-100'><span>🎙️</span> Recording</button>
                                <button onClick={() => handleAddElement('map')} className='w-full p-3 text-xs hover:bg-brass/10 text-left flex items-center gap-2 text-stone/80 hover:text-amber-100'><span>🗺️</span> Map</button>
                                <button onClick={() => handleAddElement('pdf')} className='w-full p-3 text-xs hover:bg-brass/10 text-left flex items-center gap-2 text-stone/80 hover:text-amber-100'><span>📕</span> PDF Document</button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => { setEditingArticle(activeArticle); setIsEditorOpen(true); }}
                            className='bg-brass/10 text-brass px-4 py-2 rounded-full text-xs font-semibold hover:bg-brass/20 transition-colors'
                        >
                            Edit Archive
                        </button>
                    )}

                    <button onClick={() => setDragMode(!dragMode)} className={`p-2 rounded-full ${dragMode ? 'bg-amber-500/20 text-amber-500' : 'bg-brass/10 text-brass'}`}>
                        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'></path></svg>
                    </button>
                </div>
            )}

            <div className='h-[calc(100vh-180px)]'>
                {activeArticle ? (
                    <div className='animate-in fade-in slide-in-from-bottom-4 duration-500 h-full'>
                        {currentView === 'collage' && (
                            <CollageArticle 
                                blocks={activeArticle.body} 
                                elements={activeArticle.elements}
                                onUpdatePosition={handleUpdateElementPosition}
                                onUpdateSize={handleUpdateElementSize}
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
            <ArticleEditor 
                open={isEditorOpen}
                article={editingArticle}
                author={auth.user?.username ?? 'Unknown'}
                onSave={handleUpdate}
                onClose={() => setIsEditorOpen(false)}
            />
            <MediaLibrary 
                isOpen={isMediaLibraryOpen} 
                onClose={() => setIsMediaLibraryOpen(false)} 
                onSelect={(url) => {
                    const type = url.toLowerCase().endsWith('.pdf') ? 'pdf' : (url.toLowerCase().endsWith('.mp3') || url.toLowerCase().endsWith('.wav')) ? 'recording' : 'image';
                    handleAddElement(type as any, url);
                    setIsMediaLibraryOpen(false);
                }}
            />
        </div>
      </main>
    </div>
  );
}
