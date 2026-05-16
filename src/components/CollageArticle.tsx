import { useState, useRef, MouseEvent, useEffect } from 'react';
import Draggable from 'react-draggable';
import { ArticleBlock, ArticleElement } from '../types';

type CollageArticleProps = {
  blocks: ArticleBlock[];
  elements?: ArticleElement[];
  onUpdatePosition?: (id: string, x: number, y: number) => void;
  onUpdateSize?: (id: string, width: number, height: number) => void;
  onAddBlock?: (block: ArticleBlock) => void;
  mode?: 'edit' | 'view';
};

export function CollageArticle({ blocks, elements = [], onUpdatePosition, onUpdateSize, onAddBlock, mode = 'view' }: CollageArticleProps) {
  const isEdit = mode === 'edit';
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lasso, setLasso] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleSelect = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (e.shiftKey || e.ctrlKey) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
    } else {
        next.clear();
        next.add(id);
    }
    setSelectedIds(next);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!isEdit || e.button !== 0 || e.target !== containerRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setLasso({
        x1: e.clientX - rect.left,
        y1: e.clientY - rect.top,
        x2: e.clientX - rect.left,
        y2: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!lasso || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x2 = e.clientX - rect.left;
    const y2 = e.clientY - rect.top;
    setLasso({ ...lasso, x2, y2 });

    // Multi-select logic
    const lx = Math.min(lasso.x1, x2);
    const ly = Math.min(lasso.y1, y2);
    const lw = Math.abs(lasso.x1 - x2);
    const lh = Math.abs(lasso.y1 - y2);

    const nextSelected = new Set<string>();
    elements.forEach(el => {
        if (
            el.position.x < lx + lw &&
            el.position.x + el.size.width > lx &&
            el.position.y < ly + lh &&
            el.position.y + el.size.height > ly
        ) {
            nextSelected.add(el.id);
        }
    });
    setSelectedIds(nextSelected);
  };

  const handleMouseUp = () => {
    setLasso(null);
  };

  const handleResize = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const startW = el.size.width;
    const startH = el.size.height;

    const onMove = (moveEvent: any) => {
        const deltaW = moveEvent.clientX - startX;
        const deltaH = moveEvent.clientY - startY;
        if (onUpdateSize) {
            onUpdateSize(id, Math.max(50, startW + deltaW), Math.max(50, startH + deltaH));
        }
    };

    const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const parseContent = (text: string) => {
    let parts: (string | JSX.Element)[] = [text];

    parts = parts.flatMap(part => {
        if (typeof part !== 'string') return part;
        return part.split(/(\*\*\*.*?\*\*\*)/g).map(s => {
            if (s.startsWith('***')) return <strong key={Math.random()} className='font-bold italic text-amber-100'>{s.slice(3, -3)}</strong>;
            return s;
        });
    }).flatMap(part => {
        if (typeof part !== 'string') return part;
        return part.split(/(\*\*.*?\*\*)/g).map(s => {
            if (s.startsWith('**')) return <strong key={Math.random()} className='font-bold text-amber-100'>{s.slice(2, -2)}</strong>;
            return s;
        });
    }).flatMap(part => {
        if (typeof part !== 'string') return part;
        return part.split(/(\*.*?\*)/g).map(s => {
            if (s.startsWith('*')) return <em key={Math.random()} className='italic text-stone/80'>{s.slice(1, -1)}</em>;
            return s;
        });
    }).flatMap(part => {
        if (typeof part !== 'string') return part;
        return part.split(/(~~.*?~~)/g).map(s => {
            if (s.startsWith('~~')) return <span key={Math.random()} className='line-through text-stone/50'>{s.slice(2, -2)}</span>;
            return s;
        });
    }).flatMap(part => {
        if (typeof part !== 'string') return part;
        return part.split(/(~.*?~)/g).map(s => {
            if (s.startsWith('~') && !s.startsWith('~~')) return <span key={Math.random()} className='line-through text-stone/50'>{s.slice(1, -1)}</span>;
            return s;
        });
    });

    return parts;
  };

  return (
    <div 
        ref={containerRef}
        className="relative min-h-[1000px] w-full bg-charcoal/10 rounded-3xl border border-brass/5 overflow-hidden select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => setSelectedIds(new Set())}
    >
      {lasso && (
          <div 
            className='fixed border border-amber-500 bg-amber-500/10 pointer-events-none z-[1000]'
            style={{
                left: Math.min(lasso.x1, lasso.x2) + (containerRef.current?.getBoundingClientRect().left || 0),
                top: Math.min(lasso.y1, lasso.y2) + (containerRef.current?.getBoundingClientRect().top || 0),
                width: Math.abs(lasso.x1 - lasso.x2),
                height: Math.abs(lasso.y1 - lasso.y2)
            }}
          />
      )}

      {elements.map((el) => (
        <Draggable
            key={el.id}
            position={el.position}
            disabled={!isEdit}
            onStop={(_, data) => onUpdatePosition && onUpdatePosition(el.id, data.x, data.y)}
        >
            <div 
                className={`absolute p-4 rounded-xl border transition-colors group ${selectedIds.has(el.id) ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_15px_rgba(217,119,6,0.2)]' : 'border-brass/20 bg-[#121212]'}`}
                style={{ width: el.size.width, height: el.size.height }}
                onClick={(e) => toggleSelect(el.id, e)}
            >
                <div className='w-full h-full overflow-hidden'>
                    {el.type === 'text' && <div className='text-xs leading-relaxed text-stone/90 whitespace-pre-wrap'>{parseContent(el.content)}</div>}
                    {el.type === 'image' && <img src={el.content} alt='element' className='w-full h-full object-cover rounded pointer-events-none' />}
                    {el.type === 'recording' && <div className='flex items-center gap-2 p-2 bg-brass/10 rounded text-xs text-brass'><span className='animate-pulse'>🔴</span> Recording Element</div>}
                    {el.type === 'map' && <div className='bg-brass/10 w-full h-full flex items-center justify-center text-brass'>Map Placeholder</div>}
                    {el.type === 'pdf' && <div className='w-full h-full bg-[#222] flex items-center justify-center text-red-400'>PDF Document</div>}
                </div>

                {isEdit && (
                    <div 
                        onMouseDown={(e) => handleResize(el.id, e)}
                        className='absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-brass/20 hover:bg-brass/50 rounded-tl-lg transition-colors'
                    />
                )}
            </div>
        </Draggable>
      ))}
      
      {/* Existing blocks (Rendering as legacy elements) */}
      {blocks.map((block, i) => (
         <Draggable 
            key={i} 
            position={block.position || { x: 0, y: 0 }} 
            disabled={!isEdit}
            onStop={(_, data) => onUpdatePosition && onUpdatePosition(`block-${i}`, data.x, data.y)}
         >
            <div className={`absolute p-4 w-72 bg-[#121212] border border-brass/20 rounded-xl text-stone ${selectedIds.has(`block-${i}`) ? 'border-amber-500' : ''}`}>
                <h4 className='font-bold mb-2 text-amber-100'>{block.title}</h4>
                <div className='text-xs'>{parseContent(block.content)}</div>
            </div>
         </Draggable>
      ))}
    </div>
  );
}

