import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArticleEditor } from '../components/ArticleEditor';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useCampaign } from '../hooks/useCampaign';

export function EditorPage() {
  useAuthGuard();
  const { campaignId, articleId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const campaignManager = useCampaign(auth.user?.username);

  const currentCampaign = campaignManager.campaigns.find(c => c.slug === campaignId);
  const article = articleId ? campaignManager.articles.find(a => a.id === articleId) : null;

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (articleData: any) => {
    if (!currentCampaign || isSaving) return;
    setIsSaving(true);
    try {
        if (article) {
            await campaignManager.updateArticle(articleData);
        } else {
            await campaignManager.createArticle(currentCampaign.slug, articleData);
        }
        navigate(`/Campaigns/${currentCampaign.slug}`);
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
        onClose={() => navigate(`/Campaigns/${campaignId}`)}
      />
    </div>
  );
}
