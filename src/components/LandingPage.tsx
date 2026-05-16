import { useNavigate } from 'react-router-dom';
import { AuthFrame } from './AuthFrame';
import { useAuth } from '../hooks/useAuth';

export function LandingPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    await auth.handleLogin();
    if (auth.user) {
        navigate('/Library');
    }
  };

  return (
    <div className='min-h-screen bg-[#0d0b0b] flex items-center justify-center'>
      <AuthFrame
        show={true}
        mode={auth.authMode}
        username={auth.username}
        password={auth.password}
        inviteInput={auth.inviteInput}
        authMessage={auth.authMessage}
        onClose={() => {}}
        onToggleMode={() => auth.setAuthMode(auth.authMode === 'signin' ? 'signup' : 'signin')}
        onUsernameChange={auth.setUsername}
        onPasswordChange={auth.setPassword}
        onInviteInputChange={auth.setInviteInput}
        onSubmit={handleLogin}
      />
    </div>
  );
}
