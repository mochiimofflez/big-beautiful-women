import { useEffect, useState } from 'react';
import type { ArticleData, CampaignWiki } from '../types';

/** Local storage keys for persistence */
const ARTICLES_KEY = 'wbw_campaign_articles';
const CAMPAIGNS_KEY = 'wbw_campaign_wikis';

/**
 * Transforms a human-readable title into a URL-friendly slug.
 */
function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Retrieves data from local storage on initialization.
 */
function loadFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Custom hook managing the lifecycle of campaigns and their wiki articles.
 * 
 * Now supports multiple campaigns, restricted to 10 per user.
 */
export function useCampaign(username?: string) {
  const [campaigns, setCampaigns] = useState<CampaignWiki[]>(() => loadFromStorage(CAMPAIGNS_KEY));
  const [articles, setArticles] = useState<ArticleData[]>(() => loadFromStorage(ARTICLES_KEY));

  /** Persists state to localStorage whenever the collections change */
  useEffect(() => {
    window.localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    window.localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
  }, [articles]);

  // --- Campaign Operations ---

  const userCampaigns = campaigns.filter(c => c.owner === username);

  /**
   * Creates a new campaign wiki.
   * Limit: 10 per profile.
   */
  const createCampaign = (title: string, description: string) => {
    if (!username) return null;
    
    if (userCampaigns.length >= 10) {
      throw new Error('Maximum limit of 10 campaigns reached.');
    }

    const newCampaign: CampaignWiki = {
      id: `campaign-${Date.now()}`,
      slug: generateSlug(title),
      title,
      description,
      owner: username,
      createdAt: new Date().toISOString()
    };

    setCampaigns(prev => [...prev, newCampaign]);
    return newCampaign;
  };

  const getCampaignBySlug = (slug: string) => campaigns.find(c => c.slug === slug);

  // --- Article Operations ---

  /**
   * Adds a new article to a specific campaign.
   */
  const createArticle = (campaignId: string, payload: ArticleData) => {
    const now = new Date().toISOString();
    const article: ArticleData = {
      ...payload,
      id: payload.id || `article-${Date.now()}`,
      // We encode the campaignId into the ID or filter by a new property.
      // For simplicity, let's add a campaignId property to the storage.
      // But since we want to keep the ArticleData type clean, we'll prefix the ID.
      id: `c:${campaignId}:${payload.id || Date.now()}`,
      slug: payload.slug || generateSlug(payload.title),
      createdAt: payload.createdAt || now,
      updatedAt: now,
    };
    setArticles((current) => [article, ...current]);
    return article;
  };

  /**
   * Retrieves articles for a specific campaign.
   */
  const getArticlesForCampaign = (campaignId: string) => {
    return articles.filter(a => a.id.startsWith(`c:${campaignId}:`));
  };

  const updateArticle = (updated: ArticleData) => {
    setArticles((current) =>
      current.map((article) =>
        article.id === updated.id ? { ...updated, updatedAt: new Date().toISOString(), slug: generateSlug(updated.title) } : article
      )
    );
  };

  const deleteArticle = (id: string) => {
    setArticles((current) => current.filter((article) => article.id !== id));
  };

  const toggleHidden = (id: string) => {
    setArticles((current) =>
      current.map((article) =>
        article.id === id ? { ...article, hidden: !article.hidden, updatedAt: new Date().toISOString() } : article
      )
    );
  };

  return {
    campaigns,
    userCampaigns,
    createCampaign,
    getCampaignBySlug,
    getArticlesForCampaign,
    createArticle,
    updateArticle,
    deleteArticle,
    toggleHidden,
  };
}
