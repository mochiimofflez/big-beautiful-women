import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArticleEditor } from '../components/ArticleEditor';
import { useAuth } from '../hooks/useAuth';
import { useCampaign } from '../hooks/useCampaign';

export function EditorPage() {
  const { campaignSlug, articleId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const campaignManager = useCampaign(auth.user?.username);

  const currentCampaign = campaignManager.getCampaignBySlug(campaignSlug!);
  const article = articleId ? campaignManager.articles.find(a => a.id === articleId) : null;

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (articleData: any) => {
    if (!currentCampaign || isSaving) return;
    setIsSaving(true);
    try {
        if (article) {
            await campaignManager.updateArticle(articleData);
        } else {
            await campaignManager.createArticle(currentCampaign.id, articleData);
        }
        navigate(`/${currentCampaign.slug}/articles`);
    } catch (e) {
        console.error(e);
        setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal p-10">
      <ArticleEditor 
        open={true}
        article={article}
        author={auth.user?.username ?? 'Unknown'}
        onSave={handleSave}
        onClose={() => navigate(`/${campaignSlug}`)}
      />
    </div>
  );
}
