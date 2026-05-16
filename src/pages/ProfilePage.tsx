import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { ProfileMenu } from '../components/ProfileMenu';

export function ProfilePage() {
  useAuthGuard();
  const { userId } = useParams();
  const auth = useAuth();
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('Online');

  if (auth.user?.username !== userId) return <div>Access Denied</div>;

  return (
    <div className='p-10 text-stone'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Profile: {userId}</h1>
        <ProfileMenu />
      </div>
      <div className='mb-4'>
        <label>Bio</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} className='w-full p-2 bg-[#111] rounded' />
      </div>
      <div className='mb-4'>
        <label>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value)} className='w-full p-2 bg-[#111] rounded'>
          <option>Online</option>
          <option>Offline</option>
        </select>
      </div>
    </div>
  );
}
