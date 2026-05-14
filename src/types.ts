/**
 * Represents a section within the wiki, such as "Locations" or "Important Figures".
 */
export type WikiSection = {
  /** Unique identifier for the section */
  id: string;
  /** Display name of the section */
  label: string;
  /** Number of articles currently within this section */
  count: number;
  /** Whether the section is restricted (e.g., hidden from non-GM users) */
  locked?: boolean;
};

/**
 * Defines a link to another article or external source within an article body.
 */
export type SourceLink = {
  /** URL or internal slug the link points to */
  href: string;
  /** The text displayed for the link */
  label: string;
  /** Text shown when hovering over the link, providing context or a snippet */
  tooltip: string;
  /** Categorization of the link for specific styling or filtering */
  type: 'Location' | 'Person' | 'Primary Source' | 'Compendium';
};

/**
 * A discrete block of content within an article, consisting of a heading and text.
 */
export type ArticleBlock = {
  /** The title or header for this specific block */
  title: string;
  /** The main text content of the block */
  content: string;
  /** Optional collection of contextual links relevant to this block's content */
  links?: SourceLink[];
};

/**
 * A key-value pair used in the Infobox component to display quick facts.
 */
export type InfoboxItem = {
  /** The attribute name (e.g., "Born", "Status") */
  label: string;
  /** The value for the attribute */
  value: string;
};

/**
 * The full data structure for a wiki article.
 */
export type ArticleData = {
  /** Unique internal ID */
  id: string;
  /** URL-friendly identifier used for routing */
  slug: string;
  /** Full title of the article */
  title: string;
  /** A brief overview shown in search results or at the top of the article */
  summary: string;
  /** The section/category ID this article belongs to */
  type: string;
  /** Structured data for the sidebar infobox */
  infobox: InfoboxItem[];
  /** The main content of the article, divided into titled blocks */
  body: ArticleBlock[];
  /** Whether the article is hidden from non-GM users (e.g., draft or secret lore) */
  hidden: boolean;
  /** ISO timestamp of when the article was first created */
  createdAt: string;
  /** ISO timestamp of the last modification */
  updatedAt: string;
  /** The username of the person who created/edited the article */
  author: string;
};

/**
 * Data structure for a Campaign Wiki.
 */
export type CampaignWiki = {
  /** Unique ID for the campaign */
  id: string;
  /** URL-friendly slug */
  slug: string;
  /** Display name of the campaign */
  title: string;
  /** Brief description */
  description: string;
  /** The username of the owner/creator */
  owner: string;
  /** ISO timestamp */
  createdAt: string;
};

/**
 * Represents a user of the wiki system and their access levels.
 */
export type UserProfile = {
  /** Unique username used for login */
  username: string;
  /** Hashed or plain-text password (depending on implementation phase) */
  password: string;
  /** User role: 'gm' has full edit access, 'reader' is read-only with restricted visibility */
  role: 'gm' | 'reader';
  /** List of section IDs that this specific user has permission to view */
  unlockedWikis: string[];
};
