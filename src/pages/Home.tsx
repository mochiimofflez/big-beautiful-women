import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCampaign } from '../hooks/useCampaign';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { ProfileMenu } from '../components/ProfileMenu';

export function Home() {
  useAuthGuard();
  const navigate = useNavigate();
  const auth = useAuth();
  const campaignManager = useCampaign(auth.user?.username);
  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newC = await campaignManager.createCampaign(newCampaignTitle, newCampaignDesc);
      if (newC) {
        setNewCampaignTitle('');
        setNewCampaignDesc('');
        navigate('/Campaigns/' + newC.id);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteInput, setDeleteInput] = useState('');

  const handleDelete = (campaign: any) => {
    if (deleteInput !== campaign.title) {
        alert('Campaign name does not match.');
        return;
    }
    campaignManager.softDeleteCampaign(campaign.id);
    setDeleteConfirm(null);
    setDeleteInput('');
  };

  return (
    <div className='min-h-screen bg-charcoal text-stone p-10'>
      {deleteConfirm && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4'>
            <div className='bg-[#0d0b0b] border border-brass/20 p-8 rounded-3xl w-full max-w-sm'>
                <h2 className='text-xl text-amber-100 mb-4'>Delete Campaign?</h2>
                <p className='text-sm text-stone/70 mb-4'>Enter the campaign title to confirm: <span className='text-brass font-bold'>{campaignManager.campaigns.find(c => c.id === deleteConfirm)?.title}</span></p>
                <input 
                    className='w-full p-2 bg-[#151313] border border-brass/20 rounded-lg mb-4 text-stone'
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                />
                <div className='flex gap-2'>
                    <button onClick={() => setDeleteConfirm(null)} className='flex-1 p-2 rounded-lg bg-stone/10'>Cancel</button>
                    <button onClick={() => handleDelete(campaignManager.campaigns.find(c => c.id === deleteConfirm))} className='flex-1 p-2 rounded-lg bg-red-900/20 text-red-300'>Delete</button>
                </div>
            </div>
        </div>
      )}
      {auth.user && (
          <div className='absolute top-10 right-10'>
            <ProfileMenu />
          </div>
      )}
      <div className='mx-auto max-w-[1200px] space-y-12'>
        <header className='text-center space-y-4'>
          <div className='text-xs uppercase tracking-[0.4em] text-brass/70'>Grand Library Archive</div>
          <h1 className='font-display text-5xl font-semibold text-amber-200'>Worldbuilding Repository</h1>      
          <p className='text-stone/70 max-w-2xl mx-auto'>Select a campaign wiki to explore or create a new archive record. Limit 10 per profile.</p>
        </header>

        <div className='grid gap-8 lg:grid-cols-2'>
          {/* Create Campaign Panel */}
          <section className='rounded-3xl border border-brass/10 bg-[#0d0b0b] p-8 shadow-library space-y-6'>    
            <h2 className='text-2xl font-display text-amber-100'>Establish New Campaign</h2>
            <form onSubmit={handleCreateCampaign} className='space-y-4' autoComplete='off'>
              <input
                required
                placeholder='Campaign Title'
                value={newCampaignTitle}
                onChange={(e) => setNewCampaignTitle(e.target.value)}
                autoComplete='off'
                className='w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-stone outline-none focus:border-amber-400'
              />
              <textarea
                placeholder='Campaign Description (Optional)'
                value={newCampaignDesc}
                onChange={(e) => setNewCampaignDesc(e.target.value)}
                autoComplete='off'
                className='w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-stone outline-none focus:border-amber-400 min-h-[100px]'
              />
              <button
                type='submit'
                disabled={!auth.user}
                className='w-full rounded-2xl bg-brass px-4 py-3 text-sm font-semibold uppercase tracking-widest text-charcoal transition hover:bg-amber-300 disabled:opacity-50'
              >
                {auth.user ? 'Initialize Archive' : 'Sign in to Initialize'}
              </button>
            </form>
          </section>

          {/* Campaign List */}
          <section className='space-y-6'>
            <h2 className='text-2xl font-display text-amber-100'>Available Wikis</h2>
            <div className='space-y-4'>
              {campaignManager.campaigns.length === 0 ? (
                <p className='text-stone/50 italic'>No campaigns found in the library records.</p>
              ) : (
                campaignManager.activeCampaigns.map(c => (
                  <div key={c.id} className='relative group rounded-3xl border border-brass/5 bg-[#101010] p-6 hover:border-brass/30 transition-all shadow-md'>
                      <Link to={'/Campaigns/' + c.id} className='block'>
                        <div className='flex justify-between items-start mb-2'>
                          <h3 className='text-xl font-semibold text-amber-50'>{c.title}</h3>
                          <span className='text-[10px] uppercase tracking-widest text-brass/40'>By {c.owner}</span> 
                        </div>
                        <p className='text-sm text-stone/70 line-clamp-2'>{c.description}</p>
                      </Link>
                      {auth.user?.username === c.owner && (
                        <button 
                          onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteConfirm(c.id);
                          }}
                          className='absolute bottom-4 right-4 text-stone/30 hover:text-red-400'
                        >
                          ⚙️
                        </button>
                      )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
