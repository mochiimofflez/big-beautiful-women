import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCampaign } from '../hooks/useCampaign';
import { useAuth } from '../hooks/useAuth';

export function Home() {
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
        navigate(`/Campaigns/${newC.id}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal text-stone p-10">
      {auth.user && (
          <Link to={`/Users/${auth.user.username}`} className="absolute top-10 left-10 flex items-center gap-3 p-2 rounded-2xl border border-brass/10 bg-[#151313] hover:border-brass/40 transition">
            <img src={auth.user.avatarUrl || '/default-avatar.png'} alt={auth.user.username} className="h-10 w-10 rounded-full object-cover" />
            <span className="text-stone font-medium">{auth.user.username}</span>
          </Link>
      )}
      <div className="mx-auto max-w-[1200px] space-y-12">
        <header className="text-center space-y-4">
          <div className="text-xs uppercase tracking-[0.4em] text-brass/70">Grand Library Archive</div>
          <h1 className="font-display text-5xl font-semibold text-amber-200">Worldbuilding Repository</h1>
          <p className="text-stone/70 max-w-2xl mx-auto">Select a campaign wiki to explore or create a new archive record. Limit 10 per profile.</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Create Campaign Panel */}
          <section className="rounded-3xl border border-brass/10 bg-[#0d0b0b] p-8 shadow-library space-y-6">
            <h2 className="text-2xl font-display text-amber-100">Establish New Campaign</h2>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <input
                required
                placeholder="Campaign Title"
                value={newCampaignTitle}
                onChange={(e) => setNewCampaignTitle(e.target.value)}
                className="w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-stone outline-none focus:border-amber-400"
              />
              <textarea
                placeholder="Campaign Description (Optional)"
                value={newCampaignDesc}
                onChange={(e) => setNewCampaignDesc(e.target.value)}
                className="w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-stone outline-none focus:border-amber-400 min-h-[100px]"
              />
              <button
                type="submit"
                disabled={!auth.user}
                className="w-full rounded-2xl bg-brass px-4 py-3 text-sm font-semibold uppercase tracking-widest text-charcoal transition hover:bg-amber-300 disabled:opacity-50"
              >
                {auth.user ? 'Initialize Archive' : 'Sign in to Initialize'}
              </button>
            </form>
          </section>

          {/* Campaign List */}
          <section className="space-y-6">
            <h2 className="text-2xl font-display text-amber-100">Available Wikis</h2>
            <div className="space-y-4">
              {campaignManager.campaigns.length === 0 ? (
                <p className="text-stone/50 italic">No campaigns found in the library records.</p>
              ) : (
                campaignManager.campaigns.map(c => (
                  <Link
                    key={c.id}
                    to={`/Campaigns/${c.id}`}
                    className="block group rounded-3xl border border-brass/5 bg-[#101010] p-6 hover:border-brass/30 transition-all shadow-md"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-amber-50 group-hover:text-amber-200 transition-colors">{c.title}</h3>
                      <span className="text-[10px] uppercase tracking-widest text-brass/40">By {c.owner}</span>
                    </div>
                    <p className="text-sm text-stone/70 line-clamp-2">{c.description}</p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
