import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'Invitations' | 'Moderation' | 'Campaigns'>('Invitations');
  const [invites, setInvites] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data: inv } = await supabase.from('invitations').select('*');
      const { data: sub } = await supabase.from('articles').select('*').eq('status', 'pending');
      if (inv) setInvites(inv);
      if (sub) setSubmissions(sub);
    }
    loadData();
  }, []);

  const updateArticleStatus = async (id: string, status: 'published' | 'draft') => {
    await supabase.from('articles').update({ status }).eq('id', id);
    setSubmissions(submissions.filter(s => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6 backdrop-blur-md">
      <div className="flex h-[80vh] w-full max-w-5xl flex-col rounded-3xl border border-brass/20 bg-[#0d0b0b] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-brass/15 p-6">
          <h2 className="font-display text-2xl text-amber-100 uppercase tracking-widest">GM Control Center</h2>
          <button onClick={onClose} className="text-stone/60 hover:text-stone">Close</button>
        </div>

        <div className="flex border-b border-brass/15">
          {['Invitations', 'Moderation', 'Campaigns'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-4 text-xs uppercase tracking-[0.25em] transition ${
                activeTab === tab ? 'text-amber-200 border-b-2 border-amber-400' : 'text-stone/50 hover:text-stone'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'Invitations' && (
            <div className="space-y-6">
              <h3 className="text-xs uppercase text-brass/70 tracking-widest">Generate New Invite</h3>
              <button onClick={() => {}} className="rounded-xl bg-brass px-6 py-3 text-charcoal font-bold uppercase text-xs">Create Campaign Code</button>
            </div>
          )}
          {activeTab === 'Moderation' && (
            <div className="space-y-4">
              {submissions.map(sub => (
                <div key={sub.id} className="flex justify-between items-center p-4 border border-brass/10 rounded-xl">
                  <span>{sub.title}</span>
                  <div className="flex gap-2">
                    <button onClick={() => updateArticleStatus(sub.id, 'published')} className="text-emerald-500 uppercase text-[10px] font-bold">Approve</button>
                    <button onClick={() => updateArticleStatus(sub.id, 'draft')} className="text-red-500 uppercase text-[10px] font-bold">Deny</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
