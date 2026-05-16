/**
 * Represents a section within the wiki, such as 'Locations' or 'Important Figures'.
 */
export type WikiSection = {
  id: string;
  label: string;
  count: number;
  locked?: boolean;
};

/**
 * Defines the new extensible element structure for article content.
 */
export type ArticleElement = {
  id: string;
  type: 'text' | 'map' | 'image' | 'audio' | 'video' | 'pdf' | 'recording';
  content: string; // Used for text, URL, or JSON blob
  position: { x: number; y: number };
  size: { width: number; height: number };
  visibility: 'all' | 'gm-only';
  properties?: Record<string, any>;
  zIndex?: number;
};

/**
 * Defines a link to another article or external source within an article body.
 */
export type SourceLink = {
  href: string;
  label: string;
  tooltip: string;
  type: 'Location' | 'Person' | 'Primary Source' | 'Compendium';
};

/**
 * A discrete block of content within an article (Legacy - migrate to ArticleElement).
 */
export type ArticleBlock = {
  title: string;
  content: string;
  links?: SourceLink[];
  position?: { x: number; y: number };
  imageUrl?: string;
  visibility?: 'all' | 'gm-only';
  isCollapsed?: boolean;
};

/**
 * A key-value pair used in the Infobox component to display quick facts.
 */
export type InfoboxItem = {
  label: string;
  value: string;
};

/**
 * The full data structure for a wiki article.
 */
export type ArticleData = {
  id: string;
  tags?: string[];
  slug: string;
  title: string;
  summary: string;
  type: string;
  infobox: InfoboxItem[];
  body: ArticleBlock[]; // Legacy blocks
  elements?: ArticleElement[]; // New extensible elements
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
  author: string;
  category: 'Primary Source' | 'Compendium' | 'Meta-Story';
  status: 'draft' | 'pending' | 'published';
  layout_data: { frames: any[] };
  properties?: Record<string, any>;
  folderId?: string | null;
  backgroundUrl?: string;
  ambienceUrl?: string;
  isDeleted?: boolean;
  deletedAt?: string;
};

/**
 * Data structure for a folder to organize articles.
 */
export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  campaignId: string;
  visibility: 'all' | 'gm-only';
  isDeleted?: boolean;
  deletedAt?: string;
};

/**
 * Represents a single worldbuilding campaign wiki.
 */
export type CampaignWiki = {
  slug: string; // Primary Key
  title: string;
  description: string;
  ownerId: string; // UUID in DB
  createdAt: string;
  members: string[]; // Array of strings (usernames or IDs)
  playerSheets: Record<string, any>;
  items: any[];
  isDeleted?: boolean;
  deletedAt?: string;
  genres?: string[];
  customGenres?: string[];
  backgroundUrl?: string;
  inviteCode?: string;
};

/**
 * Global settings for the wiki interface.
 */
export type WikiSettings = {
  disableAnimations: boolean;
};

/**
 * Represents a user of the wiki system and their access levels.
 */
export type UserProfile = {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'gm' | 'reader' | 'guest';
  unlockedWikis: string[];
  avatarUrl?: string;
};
