import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { WikiView } from './pages/WikiView';
import { EditorPage } from './pages/EditorPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { useAuth } from './hooks/useAuth';
import { AuthFrame } from './components/AuthFrame';

export function App() {
  const { user } = useAuth();

  if (!user) {
    return <AuthFrame />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/Campaigns/:campaignId" element={<WikiView />} />
      <Route path="/Campaigns/:campaignId/:articleId" element={<WikiView />} />
      <Route path="/Campaigns/:campaignId/editor" element={<EditorPage />} />
      <Route path="/Campaigns/:campaignId/editor/:articleId" element={<EditorPage />} />
      <Route path="/Users/:userId" element={<ProfilePage />} />
      <Route path="/Admin" element={<AdminPage />} />
    </Routes>
  );
}
