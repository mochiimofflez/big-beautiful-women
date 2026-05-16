import Draggable from 'react-draggable';
import { ArticleBlock } from '../types';

type CollageArticleProps = {
  blocks: ArticleBlock[];
  onUpdatePosition?: (index: number, x: number, y: number) => void;
  onAddBlock?: (block: ArticleBlock) => void;
  mode?: 'edit' | 'view';
};

export function CollageArticle({ blocks, onUpdatePosition, onAddBlock, mode = 'view' }: CollageArticleProps) {
  const isEdit = mode === 'edit';

  const parseContent = (text: string) => {
    // Split by spoiler syntax ||text||
    let parts: (string | JSX.Element)[] = [text];

    // Spoilers
    parts = parts.flatMap(part => {
        if (typeof part !== 'string') return part;
        const subParts = part.split(/(\|\|.*?\|\|)/g);
        return subParts.map(s => {
            if (s.startsWith('||') && s.endsWith('||')) {
                const content = s.slice(2, -2);
                return <span key={Math.random()} className='bg-stone/20 blur-[4px] hover:blur-none transition-all cursor-help rounded px-1' title='Spoiler'>{content}</span>;
            }
            return s;
        });
    });

    // Links [[Slug:Label]]
    parts = parts.flatMap(part => {
        if (typeof part !== 'string') return part;
        const subParts = part.split(/(\[\[.*?\]\])/g);
        return subParts.map(s => {
            if (s.startsWith('[[') && s.endsWith(']]')) {
                const content = s.slice(2, -2);
                const [target, label] = content.includes(':') ? content.split(':') : [content, content];
                return <button key={Math.random()} className='text-brass hover:text-amber-200 underline decoration-brass/30 transition-colors'>{label}</button>;
            }
            return s;
        });
    });

    // Bold/Italic (Simple)
    return parts.map(part => {
        if (typeof part !== 'string') return part;
        return part.split(/(\*\*.*?\*\*|\*.*?\*)/g).map(s => {
            if (s.startsWith('**')) return <strong key={Math.random()} className='text-amber-100'>{s.slice(2, -2)}</strong>;
            if (s.startsWith('*')) return <em key={Math.random()} className='italic text-stone/80'>{s.slice(1, -1)}</em>;
            return s;
        });
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isEdit || !onAddBlock) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        const newBlock: ArticleBlock = {
            title: 'New Media',
            content: '',
            imageUrl: URL.createObjectURL(file),
            position: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }
        };
        onAddBlock(newBlock);
    }
  };

  return (
    <div 
        className="relative min-h-[1000px] w-full bg-charcoal/10 rounded-3xl border border-brass/5"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
    >
      {blocks.map((block, i) => {
        if (block.visibility === 'gm-only' && mode === 'view') return null;
        
        return (
          <Draggable
            key={i}
            defaultPosition={block.position || { x: 0, y: 0 }}
            onStop={(_, data) => onUpdatePosition && onUpdatePosition(i, data.x, data.y)}
            bounds="parent"
            disabled={!isEdit}
          >
            <div className={`absolute w-72 ${isEdit ? 'cursor-move' : 'cursor-default'} rounded-2xl border border-brass/20 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 ${block.title.toLowerCase().includes('parchment') ? 'parchment text-charcoal' : 'bg-charcoal/40 text-stone hover:bg-charcoal/60'}`}>
              <div className='flex justify-between items-center mb-3 border-b border-brass/10 pb-2'>
                <h3 className="text-sm font-display font-bold truncate flex-1 text-amber-100/90">{block.title || 'Untitled'}</h3>
                {block.visibility === 'gm-only' && <span className='text-[9px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded uppercase tracking-widest ml-2'>GM</span>}
              </div>
              
              {!block.isCollapsed ? (
                <div className='animate-in fade-in slide-in-from-top-1 duration-300'>
                  <div className="text-xs leading-relaxed text-stone/80 whitespace-pre-wrap selection:bg-brass/30">{parseContent(block.content)}</div>
                  {block.imageUrl && (
                    <div className='mt-4 relative group/img'>
                        <img src={block.imageUrl} alt={block.title} className="w-full rounded-lg shadow-inner border border-brass/10" />
                        <div className='absolute inset-0 bg-brass/5 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-lg pointer-events-none' />
                    </div>
                  )}
                </div>
              ) : (
                <p className='text-[10px] italic text-stone/40 py-1'>Content collapsed...</p>
              )}
            </div>
          </Draggable>
        );
      })}
    </div>
  );
}
