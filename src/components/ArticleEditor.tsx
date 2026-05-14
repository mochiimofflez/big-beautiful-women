import { useEffect, useMemo, useState } from 'react';
import type { ArticleData, InfoboxItem } from '../types';

type ArticleEditorProps = {
  open: boolean;
  article?: ArticleData | null;
  author: string;
  onSave: (article: ArticleData) => void;
  onClose: () => void;
};

// Types for the new collage engine
interface LayoutFrame {
  id: string;
  type: 'text' | 'image' | 'audio' | 'link';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  content: string;
}

export function ArticleEditor({ open, article, author, onSave, onClose }: ArticleEditorProps) {
  const [title, setTitle] = useState(article?.title ?? '');
  const [summary, setSummary] = useState(article?.summary ?? '');
  const [category, setCategory] = useState(article?.category ?? 'Compendium');
  const [frames, setFrames] = useState<LayoutFrame[]>(article?.layout_data?.frames ?? []);

  useEffect(() => {
    setTitle(article?.title ?? '');
    setSummary(article?.summary ?? '');
    setCategory(article?.category ?? 'Compendium');
    setFrames(article?.layout_data?.frames ?? []);
  }, [article, open]);

  const handleSave = () => {
    const payload = {
      ...article,
      title,
      summary,
      category,
      layout_data: { frames },
      author,
      updatedAt: new Date().toISOString(),
    } as ArticleData;
    onSave(payload);
    onClose();
  };

  const addFrame = (type: LayoutFrame['type']) => {
    const newFrame: LayoutFrame = {
      id: Date.now().toString(),
      type, x: 10, y: 10, width: 200, height: 100, zIndex: 1,
      content: ''
    };
    setFrames([...frames, newFrame]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="flex h-[90vh] w-[90vw] flex-col rounded-3xl border border-brass/20 bg-[#0d0b0b] shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-brass/10">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-transparent text-2xl font-bold text-amber-100 outline-none" placeholder="Article Title" />
          <div className="flex gap-2">
            <button onClick={() => addFrame('text')} className="px-4 py-2 border border-brass/20 text-xs uppercase hover:bg-brass/10">Text</button>
            <button onClick={() => addFrame('image')} className="px-4 py-2 border border-brass/20 text-xs uppercase hover:bg-brass/10">Image</button>
            <button onClick={handleSave} className="bg-amber-600 px-6 py-2 text-charcoal font-bold uppercase text-xs">Save Masterpiece</button>
          </div>
        </div>

        {/* Canvas for Collage */}
        <div className="flex-1 relative bg-black/30 overflow-hidden">
          {frames.map((frame, index) => (
            <div 
              key={frame.id}
              className="absolute border border-brass/30 bg-[#161616] p-2 cursor-move"
              style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height, zIndex: frame.zIndex }}
            >
              <textarea 
                value={frame.content} 
                onChange={(e) => setFrames(frames.map((f, i) => i === index ? {...f, content: e.target.value} : f))}
                className="w-full h-full bg-transparent text-xs text-stone resize-none outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
