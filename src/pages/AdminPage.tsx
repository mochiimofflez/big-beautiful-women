import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCampaign } from '../hooks/useCampaign';
import { ADMIN_USERNAMES } from '../lib/adminList';
import { CampaignWiki } from '../types';

export function AdminPage() {
  const auth = useAuth();
  const campaignManager = useCampaign(auth.user?.username);
  const [invite, setInvite] = useState('');

  if (auth.user?.role !== 'gm' && !ADMIN_USERNAMES.includes(auth.user?.username || '')) return <div>Access Denied</div>;

  return (
    <div className="p-10 text-stone">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <button 
        onClick={() => setInvite(auth.generateInviteCode('SITE'))}
        className="bg-brass text-charcoal px-4 py-2 rounded mb-6"
      >
        Generate Site Invite
      </button>
      {invite && <p className="mb-6">New Code: {invite}</p>}

      <h2 className="text-xl font-bold mb-4">Archived Campaigns</h2>
      {campaignManager.archivedCampaigns.map((c: CampaignWiki) => (
        <div key={c.id} className="flex justify-between p-4 border border-brass/20 rounded mb-2">
            <span>{c.title} (Deleted: {new Date(c.deletedAt!).toLocaleDateString()})</span>
            <button onClick={() => campaignManager.restoreCampaign(c.id)} className="text-brass">Restore</button>
        </div>
      ))}
    </div>
  );
}
