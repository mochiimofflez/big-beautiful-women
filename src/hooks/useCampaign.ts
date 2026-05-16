import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ArticleData, CampaignWiki } from '../types';

/** Local storage keys for persistence (Fallback) */
const ARTICLES_KEY = 'wbw_campaign_articles';
const CAMPAIGNS_KEY = 'wbw_campaign_wikis';

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function useCampaign(username?: string) {
  const [campaigns, setCampaigns] = useState<CampaignWiki[]>([]);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize data
  useEffect(() => {
    async function initCampaigns() {
      setLoading(true);

      // 1. Load campaigns
      const { data: remoteCampaigns } = await supabase.from('campaigns').select('*');
      if (remoteCampaigns && remoteCampaigns.length > 0) {
        setCampaigns(remoteCampaigns);
      } else {
        const raw = window.localStorage.getItem(CAMPAIGNS_KEY);
        setCampaigns(raw ? JSON.parse(raw) : []);
      }

      // 2. Load articles
      const { data: remoteArticles } = await supabase.from('articles').select('*');
      if (remoteArticles && remoteArticles.length > 0) {
        setArticles(remoteArticles);
      } else {
        const raw = window.localStorage.getItem(ARTICLES_KEY);
        setArticles(raw ? JSON.parse(raw) : []);
      }

      setLoading(false);
    }

    initCampaigns();
  }, []);

  const softDeleteCampaign = async (id: string) => {
    const updated = campaigns.map((c) =>
        c.id === id ? { ...c, isDeleted: true, deletedAt: new Date().toISOString() } : c
    );
    setCampaigns(updated);
    window.localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
  };

  const restoreCampaign = async (id: string) => {
    const updated = campaigns.map((c) =>
        c.id === id ? { ...c, isDeleted: false, deletedAt: undefined } : c
    );
    setCampaigns(updated);
    window.localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
  };

  const activeCampaigns = campaigns.filter(c => !c.isDeleted);
  const archivedCampaigns = campaigns.filter(c => c.isDeleted);

  const createCampaign = async (title: string, description: string) => {
    if (!username) return null;
    if (userCampaigns.length >= 10) throw new Error('Maximum limit of 10 campaigns reached.');

    const newCampaign: CampaignWiki = {
      id: `${Date.now()}`,
      slug: generateSlug(title),
      title,
      description,
      owner: username,
      createdAt: new Date().toISOString()
    };

    const { error } = await supabase.from('campaigns').insert([newCampaign]);
    if (error) console.warn('Supabase campaign save failed:', error);

    const updated = [...campaigns, newCampaign];
    setCampaigns(updated);
    window.localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
    return newCampaign;
  };

  const getCampaignBySlug = useCallback((slug: string) => campaigns.find(c => c.slug === slug), [campaigns]);   

  const createArticle = async (campaignId: string, payload: ArticleData) => {
    const now = new Date().toISOString();
    const article: ArticleData = {
      ...payload,
      id: `${campaignId}:${payload.id || Date.now()}`,
      slug: payload.slug || generateSlug(payload.title),
      createdAt: payload.createdAt || now,
      updatedAt: now,
    };

    const { error } = await supabase.from('articles').insert([article]);
    if (error) console.warn('Supabase article save failed:', error);

    const updated = [article, ...articles];
    setArticles(updated);
    window.localStorage.setItem(ARTICLES_KEY, JSON.stringify(updated));
    return article;
  };

  const getArticlesForCampaign = useCallback((campaignId: string) => {
    return articles.filter(a => a.id.startsWith(`${campaignId}:`));
  }, [articles]);

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

  const userCampaigns = activeCampaigns.filter(c => c.owner === username);
  const invitedCampaigns = activeCampaigns.filter(c => c.owner !== username);

  return {
    campaigns,
    activeCampaigns,
    archivedCampaigns,
    userCampaigns,
    invitedCampaigns,
    articles,
    createCampaign,
    softDeleteCampaign,
    restoreCampaign,
    getCampaignBySlug,
    getArticlesForCampaign,
    createArticle,
    updateArticle,
    deleteArticle,
    toggleHidden,
  };
}
