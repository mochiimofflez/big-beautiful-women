import { useEffect, useMemo, useState } from 'react';
import type { ArticleData, InfoboxItem, ArticleBlock } from '../types';

type ArticleEditorProps = {
  open: boolean;
  article?: ArticleData | null;
  author: string;
  onSave: (article: ArticleData) => void;
  onClose: () => void;
};

const emptyBlock = (): ArticleBlock => ({ title: '', content: '' });
const emptyInfobox = (): InfoboxItem => ({ label: '', value: '' });

export function ArticleEditor({ open, article, author, onSave, onClose }: ArticleEditorProps) {
  const [title, setTitle] = useState(article?.title ?? '');
  const [summary, setSummary] = useState(article?.summary ?? '');
  const [type, setType] = useState(article?.type ?? 'Compendium');
  const [hidden, setHidden] = useState(article?.hidden ?? false);
  const [blocks, setBlocks] = useState<ArticleBlock[]>(article?.body ?? [emptyBlock()]);
  const [infobox, setInfobox] = useState<InfoboxItem[]>(article?.infobox ?? [emptyInfobox(), emptyInfobox()]);

  useEffect(() => {
    setTitle(article?.title ?? '');
    setSummary(article?.summary ?? '');
    setType(article?.type ?? 'Compendium');
    setHidden(article?.hidden ?? false);
    setBlocks(article?.body ?? [emptyBlock()]);
    setInfobox(article?.infobox ?? [emptyInfobox(), emptyInfobox()]);
  }, [article, open]);

  const isEditMode = Boolean(article);

  const slug = useMemo(() => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), [title]);

  const handleSave = () => {
    if (!title.trim()) return;
    const validBlocks = blocks.filter((block) => block.title.trim() || block.content.trim());
    const validInfobox = infobox.filter((item) => item.label.trim() && item.value.trim());

    const payload: ArticleData = {
      id: article?.id ?? `article-${Date.now()}`,
      slug,
      title: title.trim(),
      summary: summary.trim(),
      type: type.trim() || 'Compendium',
      infobox: validInfobox,
      body: validBlocks.length ? validBlocks : [emptyBlock()],
      hidden,
      author,
      createdAt: article?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);
    onClose();
  };

  const updateBlock = (index: number, field: keyof ArticleBlock, value: string) => {
    setBlocks((current) => current.map((block, idx) => (idx === index ? { ...block, [field]: value } : block)));
  };

  const updateInfobox = (index: number, field: keyof InfoboxItem, value: string) => {
    setInfobox((current) => current.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  };

  const addBlock = () => setBlocks((current) => [...current, emptyBlock()]);
  const addInfobox = () => setInfobox((current) => [...current, emptyInfobox()]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl overflow-auto rounded-3xl border border-brass/10 bg-[#0d0b0b] p-8 shadow-library">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-brass/70">{isEditMode ? 'Edit Article' : 'New Article'}</div>
            <h2 className="mt-2 text-2xl font-semibold text-amber-100">{title || 'Untitled Entry'}</h2>
          </div>
          <button className="text-sm text-stone/70 hover:text-stone" onClick={onClose}>Close</button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="text-stone/80">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl border border-brass/20 bg-[#111] px-4 py-3 text-sm text-stone outline-none focus:border-amber-300"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-stone/80">Article Type</span>
            <input
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-full rounded-2xl border border-brass/20 bg-[#111] px-4 py-3 text-sm text-stone outline-none focus:border-amber-300"
            />
          </label>
        </div>

        <label className="mt-4 block space-y-2 text-sm">
          <span className="text-stone/80">Summary</span>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={3}
            className="w-full rounded-3xl border border-brass/20 bg-[#111] px-4 py-3 text-sm text-stone outline-none focus:border-amber-300"
          />
        </label>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-brass/10 bg-[#111] p-4">
            <div className="mb-3 text-xs uppercase tracking-[0.35em] text-brass/70">Infobox</div>
            <div className="space-y-3">
              {infobox.map((item, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[0.9fr_1.1fr]">
                  <input
                    value={item.label}
                    onChange={(event) => updateInfobox(index, 'label', event.target.value)}
                    placeholder="Label"
                    className="rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-sm text-stone outline-none"
                  />
                  <input
                    value={item.value}
                    onChange={(event) => updateInfobox(index, 'value', event.target.value)}
                    placeholder="Value"
                    className="rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-sm text-stone outline-none"
                  />
                </div>
              ))}
              <button
                type="button"
                className="mt-2 rounded-2xl border border-brass/20 bg-brass/10 px-4 py-3 text-sm text-brass transition hover:bg-brass/20"
                onClick={addInfobox}
              >
                Add Infobox Row
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-brass/10 bg-[#111] p-4">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.35em] text-brass/70">
              <span>Visibility</span>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-stone/80">
                <input type="checkbox" checked={hidden} onChange={(event) => setHidden(event.target.checked)} className="h-4 w-4 rounded border-brass/20 bg-[#0f0d0d] text-brass" />
                Hidden
              </label>
            </div>
            <p className="text-sm leading-6 text-stone/70">
              Hidden articles remain out of public view until you decide to publish them again.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-brass/10 bg-[#111] p-4">
          <div className="mb-3 text-xs uppercase tracking-[0.35em] text-brass/70">Article Sections</div>
          <div className="space-y-4">
            {blocks.map((block, index) => (
              <div key={index} className="space-y-3 rounded-3xl border border-brass/10 bg-[#0f0d0d] p-4">
                <input
                  value={block.title}
                  onChange={(event) => updateBlock(index, 'title', event.target.value)}
                  placeholder="Section title"
                  className="w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-sm text-stone outline-none"
                />
                <textarea
                  value={block.content}
                  onChange={(event) => updateBlock(index, 'content', event.target.value)}
                  rows={4}
                  placeholder="Section content"
                  className="w-full rounded-3xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-sm text-stone outline-none"
                />
              </div>
            ))}
            <button
              type="button"
              className="rounded-2xl border border-brass/20 bg-brass/10 px-4 py-3 text-sm text-brass transition hover:bg-brass/20"
              onClick={addBlock}
            >
              Add Section
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-stone/70">Author: {author}</div>
          <button
            type="button"
            className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-charcoal transition hover:bg-amber-400"
            onClick={handleSave}
          >
            {isEditMode ? 'Save Changes' : 'Create Article'}
          </button>
        </div>
      </div>
    </div>
  );
}
