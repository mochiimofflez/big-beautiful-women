import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { ProfileMenu } from '../components/ProfileMenu';
import { supabase } from '../lib/supabase';

export function ProfilePage() {
  useAuthGuard();
  const { userId } = useParams();
  const auth = useAuth();
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('Online');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!auth.user || auth.user.username !== userId) return <div className='p-20 text-center text-stone/50 italic'>Access Denied</div>;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !auth.user) return;

      if (file.size > 10 * 1024 * 1024) {
          alert('File size exceeds 10MB limit.');
          return;
      }

      setUploading(true);
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${auth.user.id}-${Math.random()}.${fileExt}`;
          const filePath = `avatars/${fileName}`;

          const { error: uploadError } = await supabase.storage
              .from('media')
              .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
              .from('media')
              .getPublicUrl(filePath);

          const { error: updateError } = await supabase
              .from('profiles')
              .update({ avatar_url: publicUrl })
              .eq('id', auth.user.id);

          if (updateError) throw updateError;
          
          alert('Profile picture updated!');
          window.location.reload(); // Quick way to refresh auth state
      } catch (error: any) {
          alert('Error uploading avatar: ' + error.message);
      } finally {
          setUploading(false);
      }
  };

  return (
    <div className='p-10 max-w-4xl mx-auto text-stone'>
      <div className='flex justify-between items-center mb-12 border-b border-brass/10 pb-6'>
        <div className='flex items-center gap-6'>
            <div 
                className='relative w-24 h-24 rounded-full border-2 border-brass/20 overflow-hidden bg-charcoal group cursor-pointer'
                onClick={() => fileInputRef.current?.click()}
            >
                {auth.user.avatarUrl ? (
                    <img src={auth.user.avatarUrl} alt='Avatar' className='w-full h-full object-cover' />
                ) : (
                    <div className='w-full h-full flex items-center justify-center text-3xl opacity-20'>👤</div>
                )}
                <div className='absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase font-bold text-brass'>
                    {uploading ? 'Uploading...' : 'Change'}
                </div>
            </div>
            <div>
                <h1 className='text-3xl font-display font-bold text-amber-100'>{userId}</h1>
                <p className='text-xs text-stone/50 uppercase tracking-widest'>{auth.user.role}</p>
            </div>
        </div>
        <ProfileMenu />
      </div>

      <input type='file' ref={fileInputRef} onChange={handleUpload} className='hidden' accept='image/*' />

      <div className='grid md:grid-cols-2 gap-12'>
          <section className='space-y-6'>
              <div>
                <label className='block text-[10px] uppercase tracking-[0.3em] text-brass/50 font-bold mb-2'>Biography</label>
                <textarea 
                    value={bio} 
                    onChange={e => setBio(e.target.value)} 
                    placeholder='Tell your story...'
                    className='w-full h-48 p-4 bg-[#0d0b0b] border border-brass/10 rounded-2xl outline-none focus:border-brass/30 transition-colors text-sm leading-relaxed' 
                />
              </div>
              
              <div>
                <label className='block text-[10px] uppercase tracking-[0.3em] text-brass/50 font-bold mb-2'>Status</label>
                <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value)} 
                    className='w-full p-4 bg-[#0d0b0b] border border-brass/10 rounded-2xl outline-none focus:border-brass/30 transition-colors text-sm'
                >
                  <option>Online</option>
                  <option>Idle</option>
                  <option>Do Not Disturb</option>
                  <option>Invisible</option>
                </select>
              </div>
          </section>

          <section className='p-8 rounded-3xl bg-brass/5 border border-brass/10 border-dashed'>
              <h3 className='text-sm font-bold text-brass mb-4 uppercase tracking-widest'>Campaign Stats</h3>
              <div className='space-y-4 text-xs'>
                  <div className='flex justify-between border-b border-brass/5 pb-2'>
                      <span className='text-stone/40'>Wikis Unlocked</span>
                      <span className='text-amber-100'>{auth.user.unlockedWikis.length}</span>
                  </div>
                  <div className='flex justify-between border-b border-brass/5 pb-2'>
                      <span className='text-stone/40'>Role Authority</span>
                      <span className='text-amber-100 uppercase'>{auth.user.role}</span>
                  </div>
              </div>
          </section>
      </div>
    </div>
  );
}

