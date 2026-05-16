import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ArticleData, CampaignWiki, Folder } from '../types';

/** Local storage keys for persistence (Fallback) */
const ARTICLES_KEY = 'wbw_campaign_articles';
const CAMPAIGNS_KEY = 'wbw_campaign_wikis';
const FOLDERS_KEY = 'wbw_campaign_folders';

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function useCampaign(username?: string) {
  const [campaigns, setCampaigns] = useState<CampaignWiki[]>([]);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize data
  useEffect(() => {
    async function initCampaigns() {
      if (!username) {
        setLoading(false);
        return;
      }
      setLoading(true);

      // Fetch from Supabase
      const { data: remoteCampaigns, error: cError } = await supabase.from('campaigns').select('*');
      if (cError) console.error('Supabase campaign load error:', cError);
      
      const { data: remoteArticles, error: aError } = await supabase.from('articles').select('*');
      if (aError) console.error('Supabase article load error:', aError);

      const { data: remoteFolders, error: fError } = await supabase.from('folders').select('*');
      if (fError) console.error('Supabase folder load error:', fError);

      const campaignsToSet = remoteCampaigns && remoteCampaigns.length > 0 
          ? remoteCampaigns 
          : JSON.parse(window.localStorage.getItem(CAMPAIGNS_KEY) || '[]');
      
      const articlesToSet = remoteArticles && remoteArticles.length > 0 
          ? remoteArticles 
          : JSON.parse(window.localStorage.getItem(ARTICLES_KEY) || '[]');

      const foldersToSet = remoteFolders && remoteFolders.length > 0
          ? remoteFolders
          : JSON.parse(window.localStorage.getItem(FOLDERS_KEY) || '[]');

      setCampaigns(campaignsToSet);
      setArticles(articlesToSet);
      setFolders(foldersToSet);

      setLoading(false);
    }

    initCampaigns();
  }, [username]);

  const updateCampaign = async (updated: CampaignWiki) => {
    const { error } = await supabase.from('campaigns').update(updated).eq('id', updated.id);
    if (error) console.warn('Supabase campaign update failed:', error);

    const newList = campaigns.map(c => c.id === updated.id ? updated : c);
    setCampaigns(newList);
    window.localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(newList));
  };

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

  const cleanupExpiredCampaigns = useCallback(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const updated = campaigns.filter(c => 
        !c.isDeleted || (c.deletedAt && new Date(c.deletedAt) > thirtyDaysAgo)
    );
    
    if (updated.length !== campaigns.length) {
        setCampaigns(updated);
        window.localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
    }
  }, [campaigns]);

  useEffect(() => {
    cleanupExpiredCampaigns();
  }, [cleanupExpiredCampaigns]);

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
      createdAt: new Date().toISOString(),
      genres: [],
      customGenres: []
    };

    const { error } = await supabase.from('campaigns').insert([newCampaign]);
    if (error) console.warn('Supabase campaign save failed:', error);

    const updated = [...campaigns, newCampaign];
    setCampaigns(updated);
    window.localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
    return newCampaign;
  };

  const getCampaignBySlug = useCallback((slug: string) => campaigns.find(c => c.slug === slug), [campaigns]);   

  const createArticle = async (campaignId: string, payload: Partial<ArticleData>) => {
    const now = new Date().toISOString();
    const article: ArticleData = {
      id: `${campaignId}:${payload.id || Date.now()}`,
      slug: payload.slug || generateSlug(payload.title || 'Untitled'),
      title: payload.title || 'Untitled',
      summary: payload.summary || '',
      type: payload.type || 'Compendium',
      infobox: payload.infobox || [],
      body: payload.body || [{ title: '', content: '' }],
      hidden: payload.hidden ?? true,
      createdAt: payload.createdAt || now,
      updatedAt: now,
      author: payload.author || username || 'Unknown',
      category: payload.category || 'Compendium',
      status: payload.status || 'draft',
      layout_data: payload.layout_data || { frames: [] },
      ...payload
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
    window.localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
  };

  const deleteArticle = (id: string) => {
    const updated = articles.filter((article) => article.id !== id);
    setArticles(updated);
    window.localStorage.setItem(ARTICLES_KEY, JSON.stringify(updated));
  };

  const toggleHidden = (id: string) => {
    const updated = articles.map((article) =>
        article.id === id ? { ...article, hidden: !article.hidden, updatedAt: new Date().toISOString() } : article
    );
    setArticles(updated);
    window.localStorage.setItem(ARTICLES_KEY, JSON.stringify(updated));
  };

  const createFolder = async (campaignId: string, name: string, parentId: string | null = null) => {
    const newFolder: Folder = {
        id: `folder-${Date.now()}`,
        name,
        parentId,
        campaignId
    };
    
    const { error } = await supabase.from('folders').insert([newFolder]);
    if (error) console.warn('Supabase folder save failed:', error);

    const updated = [...folders, newFolder];
    setFolders(updated);
    window.localStorage.setItem(FOLDERS_KEY, JSON.stringify(updated));
    return newFolder;
  };

  const updateFolder = (updated: Folder) => {
    const newList = folders.map(f => f.id === updated.id ? updated : f);
    setFolders(newList);
    window.localStorage.setItem(FOLDERS_KEY, JSON.stringify(newList));
  };

  const deleteFolder = (id: string) => {
    const newList = folders.filter(f => f.id !== id);
    setFolders(newList);
    window.localStorage.setItem(FOLDERS_KEY, JSON.stringify(newList));
  };

  const getFoldersForCampaign = useCallback((campaignId: string) => {
    return folders.filter(f => f.campaignId === campaignId);
  }, [folders]);

  const userCampaigns = activeCampaigns.filter(c => c.owner === username);
  const invitedCampaigns = activeCampaigns.filter(c => c.owner !== username);

  return {
    campaigns,
    activeCampaigns,
    archivedCampaigns,
    userCampaigns,
    invitedCampaigns,
    articles,
    folders,
    loading,
    createCampaign,
    updateCampaign,
    softDeleteCampaign,
    restoreCampaign,
    getCampaignBySlug,
    getArticlesForCampaign,
    createArticle,
    updateArticle,
    deleteArticle,
    toggleHidden,
    createFolder,
    updateFolder,
    deleteFolder,
    getFoldersForCampaign,
  };
}
