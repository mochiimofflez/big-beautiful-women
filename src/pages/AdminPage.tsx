import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useCampaign } from '../hooks/useCampaign';
import { CampaignWiki } from '../types';

export function AdminPage() {
  useAuthGuard();
  const auth = useAuth();
  const campaignManager = useCampaign(auth.user?.username);
  const [invite, setInvite] = useState('');

  if (auth.user?.role !== 'admin') return <div>Access Denied</div>;

  return (
    <div className='p-10 text-stone'>
      <h1 className='text-2xl font-bold mb-4'>Admin Panel</h1>
      
      <div className='mb-6 p-6 border border-brass/20 rounded-2xl bg-[#101010]'>
        <h2 className='text-lg font-bold mb-4'>Manage Site Access</h2>
        <button
          onClick={async () => {
            const code = await auth.generateInviteCode('SITE');
            if (code) setInvite(code);
          }}
          className='bg-brass text-charcoal px-6 py-2 rounded-lg font-semibold hover:bg-amber-300 transition'
        >
          Generate Site Access Key
        </button>
        {auth.inviteMessage && <p className='mt-4 text-brass'>{auth.inviteMessage}</p>}
        {invite && <p className='mt-2 text-sm text-stone/70'>Newly generated key: <strong className='text-amber-200'>{invite}</strong></p>}
      </div>

      <h2 className='text-xl font-bold mb-4'>Archived Campaigns</h2>
      {campaignManager.archivedCampaigns.map((c: CampaignWiki) => (
        <div key={c.id} className='flex justify-between p-4 border border-brass/20 rounded mb-2'>
            <span>{c.title} (Deleted: {c.deletedAt ? new Date(c.deletedAt).toLocaleDateString() : 'N/A'})</span>
            <button onClick={() => campaignManager.restoreCampaign(c.id)} className='text-brass'>Restore</button>
        </div>
      ))}
    </div>
  );
}
