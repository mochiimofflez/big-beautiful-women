import { useEffect, useState, useRef } from 'react';
import type { ArticleData, ArticleBlock, ArticleElement } from '../types';
import { ContextMenu } from './ContextMenu';

type ArticleEditorProps = {
  open: boolean;
  article?: ArticleData | null;
  author: string;
  onSave: (article: ArticleData) => void;
  onClose: () => void;
};

const emptyBlock = (): ArticleBlock => ({ title: '', content: '' });

const CATEGORIES: Record<string, string[]> = {
  'Sources': ['Primary', 'Secondary', 'Compendium'],
  'Character': [],
  'Location': ['Settlements', 'Regions', 'Points of Interest'],
  'Faction': [],
  'Event': [],
  'Items': ['Artifacts', 'Consumables', 'Materials'],
};

export function ArticleEditor({ open, article, author, onSave, onClose }: ArticleEditorProps) {
  const [title, setTitle] = useState(article?.title ?? '');
  const [summary, setSummary] = useState(article?.summary ?? '');
  const [category, setCategory] = useState(article?.type.split(':')[0] ?? 'Sources');
  const [subCategory, setSubCategory] = useState(article?.type.includes(':') ? article.type.split(': ')[1] : '');
  const [tags, setTags] = useState(article?.tags?.join(', ') ?? '');
  const [hidden, setHidden] = useState(article?.hidden ?? false);
  const [blocks, setBlocks] = useState<ArticleBlock[]>(article?.body ?? [emptyBlock()]);
  const [elements, setElements] = useState<ArticleElement[]>(article?.elements ?? []);
  const [properties, setProperties] = useState<Record<string, any>>(article?.properties ?? { 'Alias': '' });
  const [backgroundUrl, setBackgroundUrl] = useState(article?.backgroundUrl ?? '');
  const [isAdderOpen, setIsAdderOpen] = useState(false);
  
  const textRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const adderRef = useRef<HTMLDivElement>(null);

  // History Stack (50 steps)
  const [history, setHistory] = useState<{blocks: ArticleBlock[], elements: ArticleElement[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = (newBlocks: ArticleBlock[], newElements: ArticleElement[]) => {
    const entry = { blocks: JSON.parse(JSON.stringify(newBlocks)), elements: JSON.parse(JSON.stringify(newElements)) };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(entry);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
        const prev = history[historyIndex - 1];
        setBlocks(prev.blocks);
        setElements(prev.elements);
        setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
        const next = history[historyIndex + 1];
        setBlocks(next.blocks);
        setElements(next.elements);
        setHistoryIndex(historyIndex + 1);
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (!e.ctrlKey) return;
        if (e.key === 'z') { e.preventDefault(); undo(); }
        if (e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [historyIndex, history]);

  useEffect(() => {
    setTitle(article?.title ?? '');
    setSummary(article?.summary ?? '');
    setCategory(article?.type.split(':')[0] ?? 'Sources');
    setSubCategory(article?.type.includes(':') ? article.type.split(': ')[1] : '');
    setHidden(article?.hidden ?? false);
    setBlocks(article?.body ?? [emptyBlock()]);
    setElements(article?.elements ?? []);
    setTags(article?.tags?.join(', ') ?? '');
    setProperties(article?.properties ?? { 'Alias': '' });
    setBackgroundUrl(article?.backgroundUrl ?? '');
  }, [article, open]);

  const applyFormatting = (index: number, wrapper: string) => {
    const textarea = textRefs.current[index];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);

    const formatted = wrapper.replace('TEXT', selected);
    updateBlock(index, 'content', before + formatted + after);
    
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + wrapper.indexOf('TEXT'), end + wrapper.indexOf('TEXT'));
    }, 0);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    
    const validBlocks = blocks.filter((b) => b.title || b.content);
    const payload: ArticleData = {
      id: article?.id ?? `article-${Date.now()}`,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: title.trim(),
      summary: summary.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      type: `${category}${subCategory ? ': ' + subCategory : ''}`,
      infobox: [],
      body: validBlocks.length ? validBlocks : [emptyBlock()],
      elements,
      hidden,
      author,
      createdAt: article?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: 'Compendium',
      status: 'published',
      layout_data: article?.layout_data ?? { frames: [] },
      properties,
      backgroundUrl
    };
    onSave(payload);
    onClose();
  };

  const addElement = (type: ArticleElement['type']) => {
    const newElement: ArticleElement = {
        id: `${Date.now()}`,
        type,
        content: type === 'text' ? 'New text content...' : '',
        position: { x: 50, y: 50 },
        size: { width: 300, height: 200 },
        visibility: 'all'
    };
    const nextElements = [...elements, newElement];
    setElements(nextElements);
    saveToHistory(blocks, nextElements);
    setIsAdderOpen(false);
  };

  const updateBlock = (index: number, field: keyof ArticleBlock, value: any) => {
    const nextBlocks = blocks.map((b, i) => (i === index ? { ...b, [field]: value } : b));
    setBlocks(nextBlocks);
    saveToHistory(nextBlocks, elements);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div 
        className="w-full max-w-5xl max-h-[95vh] overflow-auto rounded-3xl border border-brass/10 bg-[#0d0b0b] p-8 shadow-library relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-semibold text-amber-100">{article ? 'Edit Article' : 'New Article'}</h2>
            </div>
            <button onClick={onClose} className="text-stone/70 hover:text-red-400 transition-colors px-4 py-2">Close</button>
        </div>

        <div className='grid lg:grid-cols-[1fr,320px] gap-8'>
            <div className='space-y-6'>
                <section className='space-y-4'>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full p-4 rounded-2xl bg-[#111] border border-brass/20 text-stone outline-none focus:border-amber-500 transition-colors" />
                </section>

                <section className='space-y-4'>
                    <h3 className='text-[10px] uppercase tracking-[0.3em] text-brass/50 font-bold'>Content Blocks</h3>
                    <div className="space-y-4">
                        {blocks.map((block, i) => (
                            <div key={i} className="p-5 rounded-3xl bg-[#0f0d0d] border border-brass/10">
                                <div className="flex gap-2 mb-3">
                                    <button type="button" onClick={() => applyFormatting(i, '**TEXT**')} className="px-3 py-1 bg-brass/10 text-[9px] text-brass rounded uppercase tracking-widest">Bold</button>
                                    <button type="button" onClick={() => applyFormatting(i, '*TEXT*')} className="px-3 py-1 bg-brass/10 text-[9px] text-brass rounded uppercase tracking-widest">Italic</button>
                                    <button type="button" onClick={() => applyFormatting(i, '~~TEXT~~')} className="px-3 py-1 bg-brass/10 text-[9px] text-brass rounded uppercase tracking-widest">Strikethrough</button>
                                </div>
                                <textarea 
                                    ref={(el) => (textRefs.current[i] = el)}
                                    value={block.content} 
                                    onKeyDown={(e) => {
                                        const shortcuts: Record<string, string> = { 
                                            '*': '*TEXT*', 
                                            '"': '"TEXT"', 
                                            "'": "'TEXT'", 
                                            '~': '~TEXT~' 
                                        };
                                        if (shortcuts[e.key]) { 
                                            e.preventDefault(); 
                                            applyFormatting(i, shortcuts[e.key]); 
                                        }
                                    }}
                                    onChange={(e) => updateBlock(i, 'content', e.target.value)}
                                    className="w-full p-2 bg-transparent text-sm min-h-[120px] outline-none text-stone/90" 
                                />
                            </div>
                        ))}
                        <div className="relative" ref={adderRef}>
                            <button 
                                onClick={() => setIsAdderOpen(!isAdderOpen)} 
                                className="w-12 h-12 flex items-center justify-center rounded-full border border-brass/20 bg-brass/5 text-brass hover:bg-brass/10 transition-all text-xl"
                                title="Add Element"
                            >
                                +
                            </button>
                            {isAdderOpen && (
                                <div className='absolute bottom-full mb-4 w-48 bg-[#1a1a1a] border border-brass/20 rounded-2xl overflow-hidden shadow-2xl z-[60]'>
                                    <div className='p-2 text-[10px] uppercase tracking-widest text-brass/50 border-b border-brass/10'>Add Element</div>
                                    <button onClick={() => addElement('text')} className='w-full p-3 text-xs hover:bg-brass/10 text-left flex items-center gap-2'><span>📄</span> Text Box</button>
                                    <button onClick={() => addElement('image')} className='w-full p-3 text-xs hover:bg-brass/10 text-left flex items-center gap-2'><span>🖼️</span> Picture</button>
                                    <button onClick={() => addElement('recording')} className='w-full p-3 text-xs hover:bg-brass/10 text-left flex items-center gap-2'><span>🎙️</span> Recording</button>
                                    <button onClick={() => addElement('map')} className='w-full p-3 text-xs hover:bg-brass/10 text-left flex items-center gap-2'><span>🗺️</span> Map</button>
                                    <button onClick={() => addElement('pdf')} className='w-full p-3 text-xs hover:bg-brass/10 text-left flex items-center gap-2'><span>📕</span> PDF Document</button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
            
            <button onClick={handleSave} className="w-full p-5 rounded-2xl bg-brass text-charcoal font-display font-black text-xs uppercase tracking-[0.25em] hover:bg-amber-400 transition-all shadow-2xl active:scale-[0.98]">Save Archive</button>
        </div>
      </div>
    </div>
  );
}
