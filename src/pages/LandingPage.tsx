import { useParams, Link } from 'react-router-dom';
import { useCampaign } from '../hooks/useCampaign';
import { useAuth } from '../hooks/useAuth';

export function LandingPage() {
  const { campaignSlug } = useParams();
  const auth = useAuth();
  const campaignManager = useCampaign(auth.user?.username);
  const campaign = campaignManager.getCampaignBySlug(campaignSlug!);

  if (!campaign) return <div>Campaign not found</div>;

  return (
    <div className="min-h-screen bg-charcoal text-stone p-10">
      <h1 className="text-4xl text-amber-200">{campaign.title}</h1>
      <p>{campaign.description}</p>
      <Link to={`/${campaign.slug}/articles`} className="text-brass">Enter Wiki</Link>
    </div>
  );
}
