import { useEffect, useState, useRef } from 'react';
import type { ArticleData, ArticleBlock } from '../types';

type ArticleEditorProps = {
  open: boolean;
  article?: ArticleData | null;
  author: string;
  onSave: (article: ArticleData) => void;
  onClose: () => void;
};

const emptyBlock = (): ArticleBlock => ({ title: '', content: '' });

const CATEGORIES: Record<string, string[]> = {
  'Sources': ['Primary', 'Secondary', 'Tertiary'],
  'Items': ['Artifacts', 'Consumables', 'Materials'],
  'Locations': ['Settlements', 'Regions', 'Points of Interest'],
  'Compendium': []
};

export function ArticleEditor({ open, article, author, onSave, onClose }: ArticleEditorProps) {
  const [title, setTitle] = useState(article?.title ?? '');
  const [summary, setSummary] = useState(article?.summary ?? '');
  const [category, setCategory] = useState(article?.type.split(':')[0] ?? 'Compendium');
  const [subCategory, setSubCategory] = useState(article?.type.includes(':') ? article.type.split(': ')[1] : '');
  const [tags, setTags] = useState(article?.tags?.join(', ') ?? '');
  const [hidden, setHidden] = useState(article?.hidden ?? false);
  const [blocks, setBlocks] = useState<ArticleBlock[]>(article?.body ?? [emptyBlock()]);
  const textRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    setTitle(article?.title ?? '');
    setSummary(article?.summary ?? '');
    setCategory(article?.type.split(':')[0] ?? 'Compendium');
    setSubCategory(article?.type.includes(':') ? article.type.split(': ')[1] : '');
    setHidden(article?.hidden ?? false);
    setBlocks(article?.body ?? [emptyBlock()]);
    setTags(article?.tags?.join(', ') ?? '');
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
      hidden,
      author,
      createdAt: article?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: 'Compendium',
      status: 'published',
      layout_data: { frames: [] }
    };
    onSave(payload);
    onClose();
  };

  const updateBlock = (index: number, field: keyof ArticleBlock, value: string) => {
    setBlocks((current) => current.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  };

  const addBlock = () => setBlocks((current) => [...current, emptyBlock()]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl max-h-[90vh] overflow-auto rounded-3xl border border-brass/10 bg-[#0d0b0b] p-8 shadow-library"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex justify-between">
            <h2 className="text-2xl font-semibold text-amber-100">{article ? 'Edit Article' : 'New Article'}</h2>
            <button onClick={onClose} className="text-stone/70">Close</button>
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full p-3 mb-4 rounded-2xl bg-[#111] border border-brass/20 text-stone" />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)" className="w-full p-3 mb-4 rounded-2xl bg-[#111] border border-brass/20 text-stone" />
        
        <div className="grid grid-cols-2 gap-4 mb-4">
            <select value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory(''); }} className="p-3 rounded-2xl bg-[#111] border border-brass/20 text-stone">
                {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {CATEGORIES[category]?.length > 0 && (
                <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="p-3 rounded-2xl bg-[#111] border border-brass/20 text-stone">
                    <option value="">Select Sub-Category</option>
                    {CATEGORIES[category].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            )}
        </div>

        <div className="space-y-4">
            {blocks.map((block, i) => (
                <div key={i} className="p-4 rounded-3xl bg-[#0f0d0d] border border-brass/10">
                    <input value={block.title} onChange={(e) => updateBlock(i, 'title', e.target.value)} placeholder="Section title" className="w-full p-2 mb-2 bg-transparent border-b border-brass/20" />
                    
                    <div className="flex gap-2 mb-2">
                        <button type="button" onClick={() => applyFormatting(i, '**TEXT**')} className="px-2 py-1 bg-brass/10 text-xs text-brass rounded">Bold</button>
                        <button type="button" onClick={() => applyFormatting(i, '*TEXT*')} className="px-2 py-1 bg-brass/10 text-xs text-brass rounded">Italic</button>
                        <button type="button" onClick={() => applyFormatting(i, '# TEXT')} className="px-2 py-1 bg-brass/10 text-xs text-brass rounded">H1</button>
                    </div>
                    
                    <textarea 
                        ref={(el) => (textRefs.current[i] = el)}
                        value={block.content} 
                        onChange={(e) => updateBlock(i, 'content', e.target.value)} 
                        onKeyDown={(e) => {
                            if (e.ctrlKey) {
                                if (e.key === 'b') { e.preventDefault(); applyFormatting(i, '**TEXT**'); }
                                else if (e.key === 'i') { e.preventDefault(); applyFormatting(i, '*TEXT*'); }
                                else if (e.key === 'h') { e.preventDefault(); applyFormatting(i, '# TEXT'); }
                            } else {
                                const textarea = textRefs.current[i];
                                if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
                                    const triggers: Record<string, string> = { '*': '*TEXT*', '"': '"TEXT"', '\'': '\'TEXT\'', '(': '(TEXT)', '[': '[TEXT]' };
                                    if (triggers[e.key]) {
                                        e.preventDefault();
                                        applyFormatting(i, triggers[e.key]);
                                    }
                                }
                            }
                        }}
                        placeholder="Content" 
                        className="w-full p-2 bg-transparent" 
                    />
                    <input 
                      value={block.imageUrl || ''} 
                      onChange={(e) => updateBlock(i, 'imageUrl', e.target.value)} 
                      placeholder="Image URL" 
                      className="w-full p-2 mt-2 bg-transparent border-t border-brass/20" 
                    />
                </div>
            ))}
            <button onClick={addBlock} className="w-full p-3 rounded-2xl border border-brass/20 bg-brass/10 text-brass">Add Section</button>
        </div>

        <button onClick={handleSave} className="w-full mt-6 p-4 rounded-2xl bg-amber-500 text-charcoal font-bold">Save Article</button>
      </div>
    </div>
  );
}
