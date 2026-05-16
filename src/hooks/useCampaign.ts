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

export function useCampaign(username?: string, userRole?: string) {
  const [campaigns, setCampaigns] = useState<CampaignWiki[]>([]);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const isGM = userRole === 'admin' || userRole === 'gm';

  // Initialize data
  useEffect(() => {
    if (!username) {
        setLoading(false);
        return;
    }

    const fetchAll = async () => {
        setLoading(true);
        const [cRes, aRes, fRes] = await Promise.all([
            supabase.from('campaigns').select('*'),
            supabase.from('articles').select('*'),
            supabase.from('folders').select('*')
        ]);

        if (cRes.data) {
            setCampaigns(cRes.data.map(c => ({
                ...c,
                inviteCode: c.invite_code
            })));
        }
        if (aRes.data) setArticles(aRes.data);
        if (fRes.data) setFolders(fRes.data);
        setLoading(false);
    };

    fetchAll();

    // Realtime Subscriptions
    const articleChannel = supabase.channel('article-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, (payload) => {
            if (payload.eventType === 'INSERT') {
                setArticles(prev => [payload.new as ArticleData, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
                setArticles(prev => prev.map(a => a.id === payload.new.id ? payload.new as ArticleData : a));
            } else if (payload.eventType === 'DELETE') {
                setArticles(prev => prev.filter(a => a.id !== payload.old.id));
            }
        }).subscribe();

    const folderChannel = supabase.channel('folder-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, (payload) => {
            if (payload.eventType === 'INSERT') {
                setFolders(prev => [...prev, payload.new as Folder]);
            } else if (payload.eventType === 'UPDATE') {
                setFolders(prev => prev.map(f => f.id === payload.new.id ? payload.new as Folder : f));
            } else if (payload.eventType === 'DELETE') {
                setFolders(prev => prev.filter(f => f.id !== payload.old.id));
            }
        }).subscribe();

    return () => {
        supabase.removeChannel(articleChannel);
        supabase.removeChannel(folderChannel);
    };
  }, [username]);

  const updateCampaign = async (updated: CampaignWiki) => {
    const { error } = await supabase.from('campaigns').update(updated).eq('id', updated.id);
    if (error) console.warn('Supabase campaign update failed:', error);
  };

  const softDeleteCampaign = async (id: string) => {
    const { error } = await supabase.from('campaigns').update({ 
        isDeleted: true, 
        deletedAt: new Date().toISOString() 
    }).eq('id', id);
    if (error) console.warn('Supabase campaign soft delete failed:', error);
  };

  const restoreCampaign = async (id: string) => {
    const { error } = await supabase.from('campaigns').update({ 
        isDeleted: false, 
        deletedAt: null 
    }).eq('id', id);
    if (error) console.warn('Supabase campaign restore failed:', error);
  };

  const activeCampaigns = campaigns.filter(c => !c.isDeleted);
  const archivedCampaigns = campaigns.filter(c => c.isDeleted);

  const createCampaign = async (title: string, description: string) => {
    if (!username) return null;
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
    return newCampaign;
  };

  const getCampaignBySlug = useCallback((slug: string) => campaigns.find(c => c.slug === slug), [campaigns]);   

  const createArticle = async (campaignId: string, payload: Partial<ArticleData>) => {
    if (!isGM) throw new Error('Unauthorized: GM role required to create articles.');
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
    return article;
  };

  const updateArticle = async (updated: ArticleData) => {
    if (!isGM) throw new Error('Unauthorized: GM role required to update articles.');
    const { error } = await supabase.from('articles').update({
        ...updated,
        updatedAt: new Date().toISOString(),
        slug: generateSlug(updated.title)
    }).eq('id', updated.id);
    if (error) console.warn('Supabase article update failed:', error);
  };

  const deleteArticle = async (id: string) => {
    if (!isGM) throw new Error('Unauthorized: GM role required to delete articles.');
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) console.warn('Supabase article delete failed:', error);
  };

  const softDeleteArticle = async (id: string) => {
      if (!isGM) throw new Error('Unauthorized');
      const { error } = await supabase.from('articles').update({
          isDeleted: true,
          deletedAt: new Date().toISOString()
      }).eq('id', id);
      if (error) console.warn('Soft delete failed:', error);
  };

  const restoreArticle = async (id: string) => {
      if (!isGM) throw new Error('Unauthorized');
      const { error } = await supabase.from('articles').update({
          isDeleted: false,
          deletedAt: null
      }).eq('id', id);
      if (error) console.warn('Restore failed:', error);
  };

  const toggleHidden = async (id: string) => {
    if (!isGM) throw new Error('Unauthorized: GM role required to toggle visibility.');
    const article = articles.find(a => a.id === id);
    if (article) {
        await updateArticle({ ...article, hidden: !article.hidden });
    }
  };

  const getArticlesForCampaign = useCallback((campaignId: string) => {
    return articles.filter(a => a.id.startsWith(`${campaignId}:`));
  }, [articles]);

  const createFolder = async (campaignId: string, name: string, parentId: string | null = null) => {
    if (!isGM) throw new Error('Unauthorized: GM role required to create folders.');
    const newFolder: Folder = {
        id: `folder-${Date.now()}`,
        name,
        parentId,
        campaignId,
        visibility: 'all'
    };
    
    const { error } = await supabase.from('folders').insert([newFolder]);
    if (error) console.warn('Supabase folder save failed:', error);
    return newFolder;
  };

  const updateFolder = async (updated: Folder) => {
    if (!isGM) throw new Error('Unauthorized: GM role required to update folders.');
    const { error } = await supabase.from('folders').update(updated).eq('id', updated.id);
    if (error) console.warn('Supabase folder update failed:', error);
  };

  const deleteFolder = async (id: string) => {
    if (!isGM) throw new Error('Unauthorized: GM role required to delete folders.');
    const { error } = await supabase.from('folders').delete().eq('id', id);
    if (error) console.warn('Supabase folder delete failed:', error);
  };

  const softDeleteFolder = async (id: string) => {
      if (!isGM) throw new Error('Unauthorized');
      const { error } = await supabase.from('folders').update({
          isDeleted: true,
          deletedAt: new Date().toISOString()
      }).eq('id', id);
      if (error) console.warn('Folder soft delete failed:', error);
  };

  const restoreFolder = async (id: string) => {
      if (!isGM) throw new Error('Unauthorized');
      const { error } = await supabase.from('folders').update({
          isDeleted: false,
          deletedAt: null
      }).eq('id', id);
      if (error) console.warn('Folder restore failed:', error);
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
    softDeleteArticle,
    restoreArticle,
    toggleHidden,
    createFolder,
    updateFolder,
    deleteFolder,
    softDeleteFolder,
    restoreFolder,
    getFoldersForCampaign,
  };
}
