import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!auth.user) return null;

  return (
    <div className='relative' ref={menuRef}>
      <button 
        type='button'
        onClick={() => setIsOpen(!isOpen)} 
        className='flex items-center gap-3 p-2 rounded-2xl border border-brass/10 bg-[#151313] hover:border-brass/40 transition w-full'
      >
        <img src={auth.user.avatarUrl || '/default-avatar.png'} alt={auth.user.username} className='h-10 w-10 rounded-full object-cover' />
        <span className='text-stone font-medium'style={{ pointerEvents: 'none' }}>{auth.user.username}</span>
      </button>

      {isOpen && (
        <div className='absolute right-0 top-16 w-48 bg-[#1c1a1a] border border-brass/10 rounded-2xl p-2 z-50'> 
          <Link to={`/Users/${auth.user.username}`} className='block w-full text-left p-2 hover:bg-brass/10 rounded text-stone' onClick={() => setIsOpen(false)}>View Profile</Link>
          <button className='block w-full text-left p-2 hover:bg-brass/10 rounded text-stone' onClick={() => setIsOpen(false)}>Status</button>   
          <button className='block w-full text-left p-2 hover:bg-brass/10 rounded text-stone' onClick={() => setIsOpen(false)}>Settings</button> 
          {auth.user.role === 'admin' && (
            <Link to='/Admin' className='block w-full text-left p-2 hover:bg-brass/10 rounded text-amber-500' onClick={() => setIsOpen(false)}>Admin Panel</Link>
          )}
          <button onClick={() => { auth.logout(); setIsOpen(false); navigate('/Library'); }} className='block w-full text-left p-2 text-red-400 hover:bg-red-900/20 rounded'>Logout</button>
        </div>
      )}
    </div>
  );
}
