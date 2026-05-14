import type { ArticleData } from '../types';

type ArticleListProps = {
  articles: ArticleData[];
  activeArticleId: string | null;
  selectedSection: string;
  query: string;
  canManage: boolean;
  onSelect: (id: string) => void;
  onEdit: (article: ArticleData) => void;
  onDelete: (id: string) => void;
  onToggleHidden: (id: string) => void;
};

export function ArticleList({
  articles,
  activeArticleId,
  selectedSection,
  query,
  canManage,
  onSelect,
  onEdit,
  onDelete,
  onToggleHidden,
}: ArticleListProps) {
  const filtered = articles.filter((article) => {
    const matchesSection = selectedSection === 'All' || article.type === selectedSection;
    const matchesQuery = [article.title, article.summary, article.type].some((value) =>
      value.toLowerCase().includes(query.toLowerCase())
    );
    return matchesSection && matchesQuery;
  });

  if (!filtered.length) {
    return (
      <div className="rounded-3xl border border-brass/10 bg-[#0d0b0b] p-6 shadow-library">
        <div className="text-sm text-stone/70">No articles match your search or section filter.</div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-brass/10 bg-[#0d0b0b] p-4 shadow-library">
      <div className="mb-4 text-xs uppercase tracking-[0.35em] text-brass/70">Campaign Articles</div>
      <div className="space-y-3">
        {filtered.map((article) => (
          <div
            key={article.id}
            className={`rounded-3xl border px-4 py-4 transition ${
              article.id === activeArticleId ? 'border-amber-400/30 bg-[#161313]' : 'border-brass/5 bg-charcoal/90 hover:border-brass/20 '
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <button className="text-left" onClick={() => onSelect(article.id)}>
                <div className="text-base font-semibold text-stone-100">{article.title}</div>
                <div className="text-[11px] uppercase tracking-[0.35em] text-brass/70">{article.type}</div>
              </button>
              {article.hidden && <span className="rounded-full bg-red-900/80 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-red-200">Hidden</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-stone/70">
              <span>{new Date(article.updatedAt).toLocaleDateString()}</span>
              <span>{article.author}</span>
            </div>
            {canManage ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-2xl border border-brass/20 bg-brass/10 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-brass transition hover:bg-brass/20"
                  onClick={() => onEdit(article)}
                >
                  Edit
                </button>
                <button
                  className="rounded-2xl border border-stone/20 bg-[#111] px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-stone transition hover:bg-[#1d1b1b]"
                  onClick={() => onToggleHidden(article.id)}
                >
                  {article.hidden ? 'Unhide' : 'Hide'}
                </button>
                <button
                  className="rounded-2xl border border-red-700/20 bg-red-900/10 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-red-300 transition hover:bg-red-900/20"
                  onClick={() => onDelete(article.id)}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
