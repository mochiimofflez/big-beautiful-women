import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthFrame } from './AuthFrame';
import { useAuth } from '../hooks/useAuth';

export function LandingPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [handleOrEmail, setHandleOrEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Need to track username for signup
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleSubmit = async () => {
    setSuccessMessage('');
    if (mode === 'signup') {
        // Need to add handleSignUp to AuthFrame props too
        await auth.handleSignUp(username, password, email);
    } else {
        await auth.handleLogin(handleOrEmail, password);
    }
    if (auth.user) {
        if (mode === 'signup') {
            setSuccessMessage('Successfully signed up!');
        }
        setTimeout(() => navigate('/Library'), 1500);
    }
  };

  return (
    <div className='min-h-screen bg-[#0d0b0b] flex items-center justify-center'>
      <AuthFrame
        show={true}
        mode={mode}
        handleOrEmail={handleOrEmail}
        email={email}
        password={password}
        inviteInput={auth.inviteInput}
        authMessage={auth.authMessage}
        successMessage={successMessage}
        onClose={() => {}}
        onToggleMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        onHandleOrEmailChange={setHandleOrEmail}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onInviteInputChange={auth.setInviteInput}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
