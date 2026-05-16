import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function RootRedirect() {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.loading) {
      if (auth.user) {
        navigate('/Library');
      } else {
        navigate('/Login');
      }
    }
  }, [auth.user, auth.loading, navigate]);

  return null;
}
