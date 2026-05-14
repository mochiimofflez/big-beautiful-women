import { useEffect, useState } from 'react';
import type { ArticleData } from '../types';

/** Local storage key for persisting wiki articles */
const STORAGE_KEY = 'wbw_campaign_articles';

/**
 * Transforms a human-readable title into a URL-friendly slug.
 * e.g., "The Giantess of Oakhaven" -> "the-giantess-of-oakhaven"
 */
function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Retrieves articles from local storage on initialization.
 */
function loadArticles(): ArticleData[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Custom hook managing the lifecycle of wiki articles.
 * 
 * Provides operations for creating, updating, deleting, and toggling visibility
 * of campaign lore. Persists all changes to local storage.
 */
export function useCampaign() {
  const [articles, setArticles] = useState<ArticleData[]>(() => loadArticles());

  /** Persists state to localStorage whenever the articles collection changes */
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  }, [articles]);

  /**
   * Adds a new article to the collection.
   * Generates a unique ID and slug if not provided, and sets timestamps.
   */
  const createArticle = (payload: ArticleData) => {
    const now = new Date().toISOString();
    const article: ArticleData = {
      ...payload,
      id: payload.id || `article-${Date.now()}`,
      slug: payload.slug || generateSlug(payload.title),
      createdAt: payload.createdAt || now,
      updatedAt: now,
    };
    setArticles((current) => [article, ...current]);
    return article;
  };

  /**
   * Updates an existing article by ID.
   * Automatically refreshes the 'updatedAt' timestamp and regenerates the slug.
   */
  const updateArticle = (updated: ArticleData) => {
    setArticles((current) =>
      current.map((article) =>
        article.id === updated.id ? { ...updated, updatedAt: new Date().toISOString(), slug: generateSlug(updated.title) } : article
      )
    );
  };

  /** Removes an article from the collection permanently */
  const deleteArticle = (id: string) => {
    setArticles((current) => current.filter((article) => article.id !== id));
  };

  /**
   * Toggles the 'hidden' flag on an article.
   * Hidden articles are intended to be visible only to the GM (Game Master).
   */
  const toggleHidden = (id: string) => {
    setArticles((current) =>
      current.map((article) =>
        article.id === id ? { ...article, hidden: !article.hidden, updatedAt: new Date().toISOString() } : article
      )
    );
  };

  return {
    articles,
    createArticle,
    updateArticle,
    deleteArticle,
    toggleHidden,
  };
}
