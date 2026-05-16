import { useEffect, useState, useRef } from 'react';
import type { ArticleData, ArticleBlock } from '../types';
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
  const [properties, setProperties] = useState<Record<string, string>>(article?.properties ?? { 'Alias': '' });
  const [backgroundUrl, setBackgroundUrl] = useState(article?.backgroundUrl ?? '');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; blockIndex: number } | null>(null);
  const textRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    setTitle(article?.title ?? '');
    setSummary(article?.summary ?? '');
    setCategory(article?.type.split(':')[0] ?? 'Sources');
    setSubCategory(article?.type.includes(':') ? article.type.split(': ')[1] : '');
    setHidden(article?.hidden ?? false);
    setBlocks(article?.body ?? [emptyBlock()]);
    setTags(article?.tags?.join(', ') ?? '');
    setProperties(article?.properties ?? { 'Alias': '' });
    setBackgroundUrl(article?.backgroundUrl ?? '');
  }, [article, open]);

  // Auto-save
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
        if (title.trim()) {
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
              hidden,
              author,
              createdAt: article?.createdAt ?? new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              category: 'Compendium',
              status: article?.status ?? 'draft',
              layout_data: article?.layout_data ?? { frames: [] },
              properties,
              backgroundUrl
            };
            onSave(payload);
        }
    }, 30000);
    return () => clearInterval(timer);
  }, [open, title, summary, blocks, tags, category, subCategory, hidden, author, article, onSave, properties, backgroundUrl]);

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

  const handleClose = () => {
    if (window.confirm('Are you sure you want to close? Unsaved changes may be lost since the last auto-save.')) {
        onClose();
    }
  };

  const updateBlock = (index: number, field: keyof ArticleBlock, value: any) => {
    setBlocks((current) => current.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  };

  const addBlock = () => setBlocks((current) => [...current, emptyBlock()]);

  const updateProperty = (key: string, value: string) => {
    setProperties(prev => ({ ...prev, [key]: value }));
  };

  const addProperty = () => {
    const key = window.prompt('Enter property name (e.g., Power, Origin, Status):');
    if (key) updateProperty(key, '');
  };

  const removeProperty = (key: string) => {
    setProperties(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
    });
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div 
        className="w-full max-w-5xl max-h-[95vh] overflow-auto rounded-3xl border border-brass/10 bg-[#0d0b0b] p-8 shadow-library relative"
        onClick={(e) => e.stopPropagation()}
      >
        {contextMenu && (
            <ContextMenu 
                x={contextMenu.x}
                y={contextMenu.y}
                onClose={() => setContextMenu(null)}
                options={[
                    { label: 'Add Spoiler', icon: '||', onClick: () => applyFormatting(contextMenu.blockIndex, '||TEXT||') },
                    { label: 'Create Link', icon: '[[', onClick: () => applyFormatting(contextMenu.blockIndex, '[[TEXT]]') },
                    { label: 'Split Block', icon: '✂', onClick: () => {
                        const idx = contextMenu.blockIndex;
                        const block = blocks[idx];
                        const textarea = textRefs.current[idx];
                        if (textarea) {
                            const cursor = textarea.selectionStart;
                            const before = block.content.substring(0, cursor);
                            const after = block.content.substring(cursor);
                            const newBlocks = [...blocks];
                            newBlocks[idx] = { ...block, content: before };
                            newBlocks.splice(idx + 1, 0, { title: 'Continued', content: after });
                            setBlocks(newBlocks);
                        }
                    }},
                    { label: 'Make GM-Only', icon: '🔒', color: 'text-amber-500', onClick: () => updateBlock(contextMenu.blockIndex, 'visibility', 'gm-only') },
                    { label: 'Make Public', icon: '🌐', color: 'text-green-500', onClick: () => updateBlock(contextMenu.blockIndex, 'visibility', 'all') },
                ]}
            />
        )}

        <div className="mb-6 flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-semibold text-amber-100">{article ? 'Edit Article' : 'New Article'}</h2>
                <p className='text-xs text-stone/40 uppercase tracking-widest mt-1'>{article?.id || 'Draft'}</p>
            </div>
            <button onClick={handleClose} className="text-stone/70 hover:text-red-400 transition-colors px-4 py-2">Close</button>
        </div>

        <div className='grid lg:grid-cols-[1fr,320px] gap-8'>
            <div className='space-y-6'>
                <section className='space-y-4'>
                    <h3 className='text-[10px] uppercase tracking-[0.3em] text-brass/50 font-bold'>Base Identity</h3>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full p-4 rounded-2xl bg-[#111] border border-brass/20 text-stone outline-none focus:border-amber-500 transition-colors" />
                    <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Brief Summary" className="w-full p-4 rounded-2xl bg-[#111] border border-brass/20 text-stone outline-none focus:border-amber-500 transition-colors h-24" />
                </section>

                <section className='space-y-4'>
                    <h3 className='text-[10px] uppercase tracking-[0.3em] text-brass/50 font-bold'>Content Blocks</h3>
                    <div className="space-y-4">
                        {blocks.map((block, i) => (
                            <div key={i} className="p-5 rounded-3xl bg-[#0f0d0d] border border-brass/10 group transition-all hover:border-brass/30">
                                <div className='flex justify-between mb-3'>
                                    <input value={block.title} onChange={(e) => updateBlock(i, 'title', e.target.value)} placeholder="Block Title" className="bg-transparent border-none text-amber-50 font-display font-bold outline-none w-full" />
                                    <button onClick={() => setBlocks(prev => prev.filter((_, idx) => idx !== i))} className='opacity-0 group-hover:opacity-100 text-red-500/50 hover:text-red-500 text-xs transition-opacity'>Delete</button>
                                </div>
                                
                                <div className="flex gap-2 mb-3">
                                    <button type="button" onClick={() => applyFormatting(i, '**TEXT**')} className="px-3 py-1 bg-brass/10 text-[9px] text-brass rounded uppercase tracking-widest hover:bg-brass/20 transition-colors">Bold</button>
                                    <button type="button" onClick={() => applyFormatting(i, '*TEXT*')} className="px-3 py-1 bg-brass/10 text-[9px] text-brass rounded uppercase tracking-widest hover:bg-brass/20 transition-colors">Italic</button>
                                    <button type="button" onClick={() => applyFormatting(i, '# TEXT')} className="px-3 py-1 bg-brass/10 text-[9px] text-brass rounded uppercase tracking-widest hover:bg-brass/20 transition-colors">H1</button>
                                </div>
                                
                                <textarea 
                                    ref={(el) => (textRefs.current[i] = el)}
                                    value={block.content} 
                                    onChange={(e) => updateBlock(i, 'content', e.target.value)} 
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setContextMenu({ x: e.clientX, y: e.clientY, blockIndex: i });
                                    }}
                                    placeholder="Write your lore here... (Right-click for options)" 
                                    className="w-full p-2 bg-transparent text-sm min-h-[120px] outline-none text-stone/90 leading-relaxed" 
                                />
                                
                                <div className='flex items-center gap-4 mt-4 pt-3 border-t border-brass/5'>
                                    <input 
                                        value={block.imageUrl || ''} 
                                        onChange={(e) => updateBlock(i, 'imageUrl', e.target.value)} 
                                        placeholder="Image URL" 
                                        className="flex-1 bg-transparent text-[10px] text-stone/50 outline-none" 
                                    />
                                    <div className='flex gap-2 items-center'>
                                        <button 
                                            onClick={() => updateBlock(i, 'isCollapsed', !block.isCollapsed)}
                                            className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border transition-colors ${block.isCollapsed ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'border-brass/10 text-stone/40'}`}
                                        >
                                            {block.isCollapsed ? 'Collapsed' : 'Expanded'}
                                        </button>
                                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded ${block.visibility === 'gm-only' ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
                                            {block.visibility === 'gm-only' ? 'GM Only' : 'Public'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={addBlock} className="w-full p-6 rounded-3xl border border-brass/10 border-dashed bg-brass/5 text-brass/70 text-xs font-bold hover:bg-brass/10 transition-all uppercase tracking-[0.2em]">
                            + Add New Block
                        </button>
                    </div>
                </section>
            </div>

            <aside className='space-y-8'>
                <section className='space-y-4'>
                    <h3 className='text-[10px] uppercase tracking-[0.3em] text-brass/50 font-bold'>Categorization</h3>
                    <div className="space-y-3">
                        <select value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory(''); }} className="w-full p-3 rounded-xl bg-[#111] border border-brass/20 text-stone text-xs outline-none focus:border-brass/50">
                            {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {CATEGORIES[category]?.length > 0 && (
                            <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="w-full p-3 rounded-xl bg-[#111] border border-brass/20 text-stone text-xs outline-none focus:border-brass/50">
                                <option value="">Sub-Category</option>
                                {CATEGORIES[category].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        )}
                        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)" className="w-full p-3 rounded-xl bg-[#111] border border-brass/20 text-stone text-xs outline-none focus:border-brass/50" />
                    </div>
                </section>

                <section className='space-y-4'>
                    <div className='flex justify-between items-center'>
                        <h3 className='text-[10px] uppercase tracking-[0.3em] text-brass/50 font-bold'>Properties</h3>
                        <button onClick={addProperty} className='text-brass text-[10px] hover:underline'>+ Add</button>
                    </div>
                    <div className='space-y-2 max-h-[300px] overflow-y-auto no-scrollbar'>
                        {Object.entries(properties).map(([key, val]) => (
                            <div key={key} className='flex flex-col gap-1 p-3 rounded-xl bg-charcoal/50 border border-brass/5 group transition-colors hover:border-brass/20'>
                                <div className='flex justify-between'>
                                    <span className='text-[9px] uppercase tracking-wider text-brass/40'>{key}</span>
                                    {key !== 'Alias' && <button onClick={() => removeProperty(key)} className='opacity-0 group-hover:opacity-100 text-red-500 text-[8px]'>Remove</button>}
                                </div>
                                <input 
                                    value={val} 
                                    onChange={(e) => updateProperty(key, e.target.value)}
                                    placeholder={`Value for ${key}...`}
                                    className='bg-transparent text-xs text-stone outline-none border-b border-brass/10 focus:border-brass/40 pb-1'
                                />
                            </div>
                        ))}
                    </div>
                </section>

                <section className='space-y-4'>
                    <h3 className='text-[10px] uppercase tracking-[0.3em] text-brass/50 font-bold'>Appearance</h3>
                    <input 
                        value={backgroundUrl} 
                        onChange={(e) => setBackgroundUrl(e.target.value)} 
                        placeholder="Custom Background URL" 
                        className="w-full p-3 rounded-xl bg-[#111] border border-brass/20 text-stone text-xs outline-none focus:border-brass/50" 
                    />
                </section>

                <div className='pt-8 border-t border-brass/10 space-y-4'>
                    <label className='flex items-center gap-4 cursor-pointer group p-2 hover:bg-brass/5 rounded-xl transition-colors'>
                        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} className='hidden' />
                        <div className={`w-12 h-6 rounded-full border border-brass/20 transition-all flex items-center px-1 ${hidden ? 'bg-red-900/40 shadow-[0_0_10px_rgba(153,27,27,0.2)]' : 'bg-green-900/40'}`}>
                            <div className={`w-4 h-4 rounded-full bg-brass transition-all duration-300 shadow-md ${hidden ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                        <div className='flex flex-col'>
                            <span className='text-[10px] uppercase tracking-widest text-stone/80 font-bold'>{hidden ? 'Private Record' : 'Public Record'}</span>
                            <span className='text-[8px] text-stone/40 tracking-wider'>{hidden ? 'GM Only' : 'Visible to Players'}</span>
                        </div>
                    </label>
                    <button onClick={handleSave} className="w-full p-5 rounded-2xl bg-brass text-charcoal font-display font-black text-xs uppercase tracking-[0.25em] hover:bg-amber-400 transition-all shadow-2xl active:scale-[0.98]">Save Archive</button>
                </div>
            </aside>
        </div>
      </div>
    </div>
  );
}
