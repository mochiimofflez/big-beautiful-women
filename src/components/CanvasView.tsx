import { useMemo } from 'react';
import Draggable from 'react-draggable';
import type { ArticleData } from '../types';

type CanvasViewProps = {
  articles: ArticleData[];
  onSelectArticle: (id: string) => void;
};

export function CanvasView({ articles, onSelectArticle }: CanvasViewProps) {
  // Generate random positions for articles if they don't have them
  const nodes = useMemo(() => {
    return articles.map((a, i) => ({
        ...a,
        x: a.layout_data?.frames?.[0]?.x || Math.random() * 800,
        y: a.layout_data?.frames?.[0]?.y || Math.random() * 600
    }));
  }, [articles]);

  // Find connections (links like [[Slug]])
  const connections = useMemo(() => {
    const links: { from: string; to: string }[] = [];
    nodes.forEach(node => {
        node.body.forEach(block => {
            const matches = block.content.match(/\[\[(.*?)\]\]/g);
            if (matches) {
                matches.forEach(match => {
                    const targetSlug = match.slice(2, -2).split(':')[0];
                    const target = nodes.find(n => n.slug === targetSlug);
                    if (target) {
                        links.push({ from: node.id, to: target.id });
                    }
                });
            }
        });
    });
    return links;
  }, [nodes]);

  return (
    <div className='relative w-full h-full bg-[#0a0a0a] overflow-hidden rounded-3xl border border-brass/5 shadow-inner cursor-grab active:cursor-grabbing'>
      <svg className='absolute inset-0 w-full h-full pointer-events-none'>
        <defs>
            <marker id='arrowhead' markerWidth='10' markerHeight='7' refX='0' refY='3.5' orient='auto'>
                <polygon points='0 0, 10 3.5, 0 7' fill='#d4af37' opacity='0.3' />
            </marker>
        </defs>
        {connections.map((link, i) => {
            const from = nodes.find(n => n.id === link.from);
            const to = nodes.find(n => n.id === link.to);
            if (!from || !to) return null;
            return (
                <line 
                    key={i}
                    x1={from.x + 100} y1={from.y + 50}
                    x2={to.x + 100} y2={to.y + 50}
                    stroke='#d4af37'
                    strokeWidth='1'
                    strokeOpacity='0.2'
                    strokeDasharray='5,5'
                />
            );
        })}
      </svg>

      {nodes.map(node => (
          <Draggable key={node.id} defaultPosition={{ x: node.x, y: node.y }} bounds='parent'>
              <div 
                onClick={() => onSelectArticle(node.id)}
                className='absolute w-48 p-4 bg-charcoal/80 backdrop-blur-md border border-brass/20 rounded-xl shadow-2xl cursor-pointer hover:border-amber-400/50 transition-colors group'
              >
                  <div className='text-[10px] uppercase tracking-widest text-brass/40 mb-1'>{node.category}</div>
                  <h4 className='text-xs font-bold text-amber-100 group-hover:text-amber-400 transition-colors'>{node.title}</h4>
                  <p className='text-[9px] text-stone/60 line-clamp-2 mt-2 leading-relaxed'>{node.summary}</p>
              </div>
          </Draggable>
      ))}

      <div className='absolute bottom-6 right-6 p-4 bg-[#111]/80 backdrop-blur-md border border-brass/10 rounded-2xl'>
          <h5 className='text-[10px] uppercase tracking-[0.2em] text-brass/60 font-bold mb-2'>Canvas Legend</h5>
          <div className='flex items-center gap-2 text-[9px] text-stone/40'>
              <div className='w-3 h-0.5 border-t border-dashed border-brass/50' />
              <span>Visual Relationship (Wiki Link)</span>
          </div>
      </div>
    </div>
  );
}
