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
  const [campaignMemberships, setCampaignMemberships] = useState<string[]>([]);
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isGM = userRole === 'admin' || userRole === 'gm';

  const mapCampaign = (c: any): CampaignWiki => ({
    ...c,
    slug: c.id, // Primary Key column 'id' contains slug values
    ownerId: c.owner_id,
    createdAt: c.created_at,
    playerSheets: c.player_sheets || {},
    items: c.items || [],
    members: c.members || [],
    isDeleted: c.is_deleted,
    deletedAt: c.deleted_at,
    customGenres: c.custom_genres || [],
    backgroundUrl: c.background_url,
    inviteCode: c.invite_code,
    genres: c.genres || []
  });

  const mapCampaignToDB = (c: CampaignWiki) => ({
      id: c.slug, // Map 'slug' property to 'id' column
      title: c.title,
      description: c.description,
      owner_id: c.ownerId,
      created_at: c.createdAt,
      player_sheets: c.playerSheets,
      items: c.items,
      members: c.members,
      is_deleted: c.isDeleted,
      deleted_at: c.deletedAt,
      genres: c.genres,
      custom_genres: c.customGenres,
      background_url: c.backgroundUrl,
      invite_code: c.inviteCode
  });

  // Initialize data
  useEffect(() => {
    if (!username) {
        setLoading(false);
        return;
    }

    const fetchAll = async () => {
        setLoading(true);
        // Get user profile to get their UUID and memberships
        const { data: profile } = await supabase.from('profiles').select('id, unlocked_wikis').eq('username', username).single();
        if (profile) {
            setUserUuid(profile.id);
            const unlocked = profile.unlocked_wikis || [];
            setCampaignMemberships(unlocked);
        }

        const [cRes, aRes, fRes] = await Promise.all([
            supabase.from('campaigns').select('*'),
            supabase.from('articles').select('*'),
            supabase.from('folders').select('*')
        ]);

        if (cRes.data) {
            setCampaigns(cRes.data.map(mapCampaign));
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

    const campaignChannel = supabase.channel('campaign-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, (payload) => {
            if (payload.eventType === 'INSERT') {
                setCampaigns(prev => [mapCampaign(payload.new), ...prev]);
            } else if (payload.eventType === 'UPDATE') {
                setCampaigns(prev => prev.map(c => c.slug === payload.new.id ? mapCampaign(payload.new) : c));
            } else if (payload.eventType === 'DELETE') {
                setCampaigns(prev => prev.filter(c => c.slug !== payload.old.id));
            }
        }).subscribe();

    return () => {
        supabase.removeChannel(articleChannel);
        supabase.removeChannel(folderChannel);
        supabase.removeChannel(campaignChannel);
    };
  }, [username]);

  const updateCampaign = async (updated: CampaignWiki) => {
    const dbData = mapCampaignToDB(updated);
    const { error } = await supabase.from('campaigns').update(dbData).eq('id', updated.slug);
    if (error) console.warn('Supabase campaign update failed:', error);
  };

  const softDeleteCampaign = async (slug: string) => {
    const { error } = await supabase.from('campaigns').update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
    }).eq('id', slug);
    if (error) console.warn('Supabase campaign soft delete failed:', error);
  };

  const restoreCampaign = async (slug: string) => {
    const { error } = await supabase.from('campaigns').update({ 
        is_deleted: false, 
        deleted_at: null 
    }).eq('id', slug);
    if (error) console.warn('Supabase campaign restore failed:', error);
  };

  const activeCampaigns = campaigns.filter(c => 
    !c.isDeleted && 
    (c.ownerId === userUuid || campaignMemberships.includes(c.slug))
  );
  const archivedCampaigns = campaigns.filter(c => 
    c.isDeleted && 
    (c.ownerId === userUuid || campaignMemberships.includes(c.slug))
  );

  const createCampaign = async (title: string, description: string) => {
    if (!username || !userUuid) throw new Error('User not authenticated.');
    
    const slug = generateSlug(title);
    const newCampaign: CampaignWiki = {
      slug,
      title,
      description,
      ownerId: userUuid,
      createdAt: new Date().toISOString(),
      members: [],
      playerSheets: {},
      items: [],
      genres: [],
      customGenres: []
    };

    const { error } = await supabase.from('campaigns').insert([mapCampaignToDB(newCampaign)]);
    if (error) {
        if (error.code === '23505') throw new Error('A campaign with this title already exists.');
        console.error('Supabase campaign save failed:', error);
        throw new Error('Failed to establish campaign in database: ' + error.message);
    }
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
        slug: generateSlug(updated.title),
        title: updated.title,
        summary: updated.summary,
        type: updated.type,
        infobox: updated.infobox,
        body: updated.body,
        elements: updated.elements,
        hidden: updated.hidden,
        updated_at: new Date().toISOString(),
        author: updated.author,
        category: updated.category,
        status: updated.status,
        layout_data: updated.layout_data,
        folder_id: updated.folderId,
        background_url: updated.backgroundUrl,
        ambience_url: updated.ambienceUrl,
        is_deleted: updated.isDeleted,
        deleted_at: updated.deletedAt
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
          is_deleted: true,
          deleted_at: new Date().toISOString()
      }).eq('id', id);
      if (error) console.warn('Soft delete failed:', error);
  };

  const restoreArticle = async (id: string) => {
      if (!isGM) throw new Error('Unauthorized');
      const { error } = await supabase.from('articles').update({
          is_deleted: false,
          deleted_at: null
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
    
    const { error } = await supabase.from('folders').insert([{
        id: newFolder.id,
        name: newFolder.name,
        parent_id: newFolder.parentId,
        campaign_id: newFolder.campaignId,
        visibility: newFolder.visibility
    }]);
    if (error) console.warn('Supabase folder save failed:', error);
    return newFolder;
  };

  const updateFolder = async (updated: Folder) => {
    if (!isGM) throw new Error('Unauthorized: GM role required to update folders.');
    const { error } = await supabase.from('folders').update({
        name: updated.name,
        parent_id: updated.parentId,
        visibility: updated.visibility,
        is_deleted: updated.isDeleted,
        deleted_at: updated.deletedAt
    }).eq('id', updated.id);
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
          is_deleted: true,
          deleted_at: new Date().toISOString()
      }).eq('id', id);
      if (error) console.warn('Folder soft delete failed:', error);
  };

  const restoreFolder = async (id: string) => {
      if (!isGM) throw new Error('Unauthorized');
      const { error } = await supabase.from('folders').update({
          is_deleted: false,
          deleted_at: null
      }).eq('id', id);
      if (error) console.warn('Folder restore failed:', error);
  };

  const getFoldersForCampaign = useCallback((campaignId: string) => {
    return folders.filter(f => f.campaignId === campaignId);
  }, [folders]);

  const userCampaigns = activeCampaigns.filter(c => c.ownerId === userUuid);
  const invitedCampaigns = activeCampaigns.filter(c => c.ownerId !== userUuid);

  return {
    campaigns, // Keep the full list for lookup in WikiView
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
