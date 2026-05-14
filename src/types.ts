export type WikiSection = {
  id: string;
  label: string;
  count: number;
  locked?: boolean;
};

export type SourceLink = {
  href: string;
  label: string;
  tooltip: string;
  type: 'Location' | 'Person' | 'Primary Source' | 'Compendium';
};

export type ArticleBlock = {
  title: string;
  content: string;
  links?: SourceLink[];
};

export type InfoboxItem = {
  label: string;
  value: string;
};

export type ArticleData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  type: string;
  infobox: InfoboxItem[];
  body: ArticleBlock[];
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
  author: string;
};

export type UserProfile = {
  username: string;
  password: string;
  role: 'gm' | 'reader';
  unlockedWikis: string[];
};
