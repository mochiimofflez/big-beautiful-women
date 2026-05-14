type SearchBarProps = {
  /** The current search term */
  query: string;
  /** Callback function triggered when the search input changes */
  onSearch: (value: string) => void;
};

/**
 * A specialized search input component for the wiki.
 * 
 * Acts as the "Archive Terminal" interface, allowing users to filter
 * through the vast collection of lore. The styling emphasizes a 
 * scholarly or technical terminal feel.
 */
export function SearchBar({ query, onSearch }: SearchBarProps) {
  return (
    <div className="rounded-3xl border border-brass/10 bg-[#0e0c0c] p-4 shadow-library">
      {/* Diegetic Label: "Search the Archive" suggests interacting with a repository of knowledge */}
      <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-brass/70">
        Search the Archive
      </label>
      
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
