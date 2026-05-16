import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export function useAuthGuard() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only guard if loading has finished and user is null
    if (!auth.loading && auth.user === null) {
      navigate('/');
    }
  }, [auth.user, auth.loading, navigate]);

  return auth.user;
}
