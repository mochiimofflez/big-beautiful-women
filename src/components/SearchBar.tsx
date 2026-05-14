type SearchBarProps = {
  query: string;
  onSearch: (value: string) => void;
};

export function SearchBar({ query, onSearch }: SearchBarProps) {
  return (
    <div className="rounded-3xl border border-brass/10 bg-[#0e0c0c] p-4 shadow-library">
      <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-brass/70">Search the Archive</label>
      <input
        type="search"
        value={query}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Find people, places, sources..."
        className="w-full rounded-2xl border border-brass/20 bg-[#111010] px-4 py-3 text-sm text-stone outline-none transition focus:border-amber-300"
      />
    </div>
  );
}
