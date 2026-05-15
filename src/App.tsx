\import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Home } from './pages/Home';
import { WikiView } from './pages/WikiView';
import { EditorPage } from './pages/EditorPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

export function App() {
  return (
    <Routes>
      <Route path='/' element={<LandingPage />} />
      <Route path='/Library' element={<Home />} />
      <Route path='/Campaigns/:campaignId' element={<WikiView />} />
      <Route path='/Campaigns/:campaignId/:articleId' element={<WikiView />} />
      <Route path='/Campaigns/:campaignId/editor' element={<EditorPage />} />
      <Route path='/Campaigns/:campaignId/editor/:articleId' element={<EditorPage />} />
      <Route path='/Users/:userId' element={<ProfilePage />} />
      <Route path='/Admin' element={<AdminPage />} />
    </Routes>
  );
}\
