import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthFrame } from './AuthFrame';
import { useAuth } from '../hooks/useAuth';

export function LandingPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [handleOrEmail, setHandleOrEmail] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setSuccessMessage('');
    setIsLoading(true);
    if (mode === 'signup') {
        await auth.handleSignUp(username, password, email);
    } else {
        await auth.handleLogin(handleOrEmail, password);
    }
    setIsLoading(false);

    if (auth.user) {
        if (mode === 'signup') {
            setSuccessMessage('Successfully signed up! Please check your email to verify your account.');
        } else {
            setTimeout(() => navigate('/Library'), 1500);
        }
    }
  };

  return (
    <div className='min-h-screen bg-[#0d0b0b] flex items-center justify-center'>
      <AuthFrame
        show={true}
        mode={mode}
        handleOrEmail={handleOrEmail}
        username={username}
        email={email}
        password={password}
        inviteInput={auth.inviteInput}
        authMessage={auth.authMessage}
        successMessage={successMessage}
        isLoading={isLoading}
        onClose={() => {}}
        onToggleMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        onHandleOrEmailChange={setHandleOrEmail}
        onUsernameChange={setUsername}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onInviteInputChange={auth.setInviteInput}
        onSubmit={handleSubmit}
      />
    </div>
  );
  }
