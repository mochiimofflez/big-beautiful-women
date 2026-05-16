import { useState, useRef, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import type { ArticleData, Folder } from '../types';
import { ContextMenu } from './ContextMenu';

type ArticleListProps = {
  articles: ArticleData[];
  folders: Folder[];
  activeArticleId: string | null;
  query: string;
  canManage: boolean;
  onSelect: (id: string) => void;
  onEdit: (article: ArticleData) => void;
  onDelete: (id: string) => void;
  onRestoreArticle: (id: string) => void;
  onRestoreFolder: (id: string) => void;
  onMoveArticle: (articleId: string, folderId: string | null) => void;
  onToggleHidden: (id: string) => void;
  onCreateFolder?: (name: string) => void;
  onRenameArticle?: (id: string, newTitle: string) => void;
  onRenameFolder?: (id: string, newName: string) => void;
  onDuplicateArticle?: (article: ArticleData) => void;
  onExportPDF?: (id: string) => void;
  onImportFolder?: (folderId: string | null) => void;
  onToggleFavorite?: (id: string) => void;
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
  onRestoreArticle,
  onRestoreFolder,
  onMoveArticle,
  onToggleHidden,
  onCreateFolder,
  onRenameArticle,
  onRenameFolder,
  onDuplicateArticle,
  onExportPDF,
  onImportFolder,
  onToggleFavorite,
}: ArticleListProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'article' | 'folder', id: string } | null>(null);
  const longPressTimer = useRef<any>(null);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContextMenu = (e: ReactMouseEvent | { clientX: number, clientY: number, preventDefault: () => void, stopPropagation: () => void }, type: 'article' | 'folder', id: string) => {
      if (!canManage) return;
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, type, id });
  };

  const handleTouchStart = (type: 'article' | 'folder', id: string, e: ReactTouchEvent) => {
      const touch = e.touches[0];
      longPressTimer.current = setTimeout(() => {
          handleContextMenu({ 
              clientX: touch.clientX, 
              clientY: touch.clientY, 
              preventDefault: () => {}, 
              stopPropagation: () => {} 
          }, type, id);
      }, 600);
  };

  const handleTouchEnd = () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const filteredArticles = articles.filter(a => 
    !a.isDeleted && (
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.summary.toLowerCase().includes(query.toLowerCase())
    )
  );

  const deletedArticles = articles.filter(a => a.isDeleted);
  const activeFolders = folders.filter(f => !f.isDeleted);
  const deletedFolders = folders.filter(f => f.isDeleted);

  const rootArticles = filteredArticles.filter(a => !a.folderId);

  const renderArticle = (article: ArticleData) => (
    <div
      key={article.id}
      draggable
      onDragStart={(e) => {
          e.dataTransfer.setData('articleId', article.id);
          e.dataTransfer.effectAllowed = 'move';
      }}
      onContextMenu={(e) => handleContextMenu(e, 'article', article.id)}
      onTouchStart={(e) => handleTouchStart('article', article.id, e)}
      onTouchEnd={handleTouchEnd}
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
              <button onClick={(e) => { e.stopPropagation(); onEdit(article); }} title="Edit" className='p-1 hover:text-amber-200 text-[10px]'>✎</button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(article.id); }} title="Move to Trash" className='p-1 hover:text-red-400 text-[10px]'>✕</button>
          </div>
      )}
    </div>
  );

  const renderFolder = (folder: Folder) => {
    const isExpanded = expandedFolders[folder.id];
    const folderArticles = filteredArticles.filter(a => a.folderId === folder.id);
    
    return (
      <div 
        key={folder.id} 
        className='space-y-1'
        onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id)}
        onTouchStart={(e) => handleTouchStart('folder', folder.id, e)}
        onTouchEnd={handleTouchEnd}
        onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-brass/10');
        }}
        onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-brass/10');
        }}
        onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-brass/10');
            const articleId = e.dataTransfer.getData('articleId');
            if (articleId) {
                onMoveArticle(articleId, folder.id);
            }
        }}
      >
        <div 
            onClick={() => toggleFolder(folder.id)}
            className='flex items-center gap-2 px-3 py-2 text-stone/80 hover:bg-brass/5 rounded-lg cursor-pointer group'
        >
            <span className='text-xs transition-transform duration-200' style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>
            <span className='text-xs'>📁</span>
            <span className='text-xs font-semibold flex-1'>{folder.name}</span>
            <span className='text-[10px] opacity-40'>{folderArticles.length}</span>
            {canManage && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }} 
                    className='opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-[10px] transition-opacity'
                >
                    ✕
                </button>
            )}
        </div>
        
        {isExpanded && (
            <div className='ml-6 space-y-1 border-l border-brass/10 pl-2 animate-in slide-in-from-left-2 duration-200'>
                {folderArticles.map(renderArticle)}
            </div>
        )}
      </div>
    );
  };

  const getContextMenuOptions = () => {
    if (!contextMenu) return [];
    
    if (contextMenu.type === 'article') {
        const article = articles.find(a => a.id === contextMenu.id);
        if (!article) return [];
        
        return [
            { label: 'Open in New Tab', icon: '📁', onClick: () => onSelect(article.id) },
            { label: 'Edit Article', icon: '✎', onClick: () => onEdit(article) },
            { label: 'Rename', icon: '📝', onClick: () => {
                const newTitle = window.prompt('Enter new title:', article.title);
                if (newTitle && onRenameArticle) onRenameArticle(article.id, newTitle);
            }},
            { label: 'Duplicate', icon: '👯', onClick: () => onDuplicateArticle && onDuplicateArticle(article) },
            { label: 'Copy Link', icon: '🔗', onClick: () => {
                navigator.clipboard.writeText(`${window.location.origin}/Campaigns/${article.id}`);
            }},
            { label: article.hidden ? 'Show to Players' : 'Hide from Players', icon: article.hidden ? '👁️' : '🔒', onClick: () => onToggleHidden(article.id) },
            { label: 'Favorite', icon: '⭐', onClick: () => onToggleFavorite && onToggleFavorite(article.id) },
            { label: 'Export as PDF', icon: '📕', onClick: () => onExportPDF && onExportPDF(article.id) },
            { label: 'Move to Trash', icon: '✕', color: 'text-red-400 hover:text-red-300', onClick: () => onDelete(article.id) },
        ];
    } else {
        const folder = folders.find(f => f.id === contextMenu.id);
        if (!folder) return [];
        
        return [
            { label: 'Rename Folder', icon: '📝', onClick: () => {
                const newName = window.prompt('Enter new name:', folder.name);
                if (newName && onRenameFolder) onRenameFolder(folder.id, newName);
            }},
            { label: 'New Article Here', icon: '📄', onClick: () => console.log('New article in folder', folder.id) },
            { label: 'Import Folder Content', icon: '📥', onClick: () => onImportFolder && onImportFolder(folder.id) },
            { label: 'Move to Trash', icon: '✕', color: 'text-red-400 hover:text-red-300', onClick: () => onDelete(folder.id) },
        ];
    }
  };

  return (
    <div className="space-y-6">
      {contextMenu && (
          <ContextMenu 
            x={contextMenu.x} 
            y={contextMenu.y} 
            options={getContextMenuOptions()} 
            onClose={() => setContextMenu(null)} 
          />
      )}
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
        {activeFolders.map(renderFolder)}
        {rootArticles.length > 0 && (
            <div className='pt-2 space-y-1' onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                e.preventDefault();
                const articleId = e.dataTransfer.getData('articleId');
                if (articleId) onMoveArticle(articleId, null);
            }}>
                {rootArticles.map(renderArticle)}
            </div>
        )}
      </div>

      {canManage && (deletedArticles.length > 0 || deletedFolders.length > 0) && (
          <div className='pt-6 border-t border-brass/5'>
              <div className='px-3 mb-2 text-[10px] uppercase tracking-widest text-stone/30'>Recently Deleted</div>
              <div className='space-y-1 opacity-50 hover:opacity-100 transition-opacity'>
                  {deletedFolders.map(f => (
                      <div key={f.id} className='flex items-center justify-between px-3 py-1 text-xs text-stone/60'>
                          <span>📁 {f.name}</span>
                          <button onClick={() => onRestoreFolder(f.id)} className='hover:text-brass'>Restore</button>
                      </div>
                  ))}
                  {deletedArticles.map(a => (
                      <div key={a.id} className='flex items-center justify-between px-3 py-1 text-xs text-stone/60'>
                          <span>📄 {a.title}</span>
                          <button onClick={() => onRestoreArticle(a.id)} className='hover:text-brass'>Restore</button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {filteredArticles.length === 0 && activeFolders.length === 0 && (
          <div className='text-xs text-stone/40 italic text-center py-4'>No files found.</div>
      )}
    </div>
  );
}
