import { useState } from 'react';
import type { ArticleData, Folder } from '../types';

type ArticleListProps = {
  articles: ArticleData[];
  folders: Folder[];
  activeArticleId: string | null;
  query: string;
  canManage: boolean;
  onSelect: (id: string) => void;
  onEdit: (article: ArticleData) => void;
  onDelete: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onCreateFolder?: (name: string) => void;
};

export function ArticleList({
  articles,
  folders,
  activeArticleId,
  query,
  canManage,
  onSelect,
  onEdit,
  onDelete,
  onToggleHidden,
  onCreateFolder,
}: ArticleListProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.summary.toLowerCase().includes(query.toLowerCase())
  );

  const rootArticles = filteredArticles.filter(a => !a.folderId);

  const renderArticle = (article: ArticleData) => (
    <div
      key={article.id}
      className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer ${
        article.id === activeArticleId ? 'bg-brass/20 text-amber-200 shadow-sm' : 'text-stone/60 hover:bg-brass/5'
      }`}
      onClick={() => onSelect(article.id)}
    >
      <div className='flex items-center gap-2 overflow-hidden'>
        <span className='text-xs opacity-40'>📄</span>
        <span className='text-xs truncate font-medium'>{article.title}</span>
        {article.status === 'draft' && <span className='text-[10px] bg-stone/20 px-1 rounded'>Draft</span>}
        {article.hidden && <span className='text-[10px] text-red-400'>🔒</span>}
      </div>
      
      {canManage && (
          <div className='opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity'>
              <button onClick={(e) => { e.stopPropagation(); onEdit(article); }} className='p-1 hover:text-amber-200 text-[10px]'>✎</button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(article.id); }} className='p-1 hover:text-red-400 text-[10px]'>✕</button>
          </div>
      )}
    </div>
  );

  const renderFolder = (folder: Folder) => {
    const isExpanded = expandedFolders[folder.id];
    const folderArticles = filteredArticles.filter(a => a.folderId === folder.id);
    
    return (
      <div key={folder.id} className='space-y-1'>
        <div 
            onClick={() => toggleFolder(folder.id)}
            className='flex items-center gap-2 px-3 py-2 text-stone/80 hover:bg-brass/5 rounded-lg cursor-pointer group'
        >
            <span className='text-xs transition-transform duration-200' style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>
            <span className='text-xs'>📁</span>
            <span className='text-xs font-semibold flex-1'>{folder.name}</span>
            <span className='text-[10px] opacity-40'>{folderArticles.length}</span>
        </div>
        
        {isExpanded && (
            <div className='ml-6 space-y-1 border-l border-brass/10 pl-2 animate-in slide-in-from-left-2 duration-200'>
                {folderArticles.map(renderArticle)}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {canManage && onCreateFolder && (
          <button 
            onClick={() => {
                const name = window.prompt('Enter folder name:');
                if (name) onCreateFolder(name);
            }}
            className='w-full p-2 text-[10px] uppercase tracking-widest text-brass/50 hover:text-brass border border-brass/10 border-dashed rounded-lg transition-colors'
          >
            + Create Folder
          </button>
      )}

      <div className="space-y-1">
        {folders.map(renderFolder)}
        {rootArticles.length > 0 && (
            <div className='pt-2 space-y-1'>
                {rootArticles.map(renderArticle)}
            </div>
        )}
      </div>

      {filteredArticles.length === 0 && (
          <div className='text-xs text-stone/40 italic text-center py-4'>No files found.</div>
      )}
    </div>
  );
}
