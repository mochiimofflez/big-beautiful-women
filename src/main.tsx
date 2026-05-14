import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import './index.css';

/**
 * Root entry point for the Worldbuilding Wiki.
 * Uses HashRouter for maximum compatibility with GitHub Pages.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        {/* Home: Campaign Repository Hub */}
        <Route path="/" element={<App />} />
        
        {/* Campaign Landing Page */}
        <Route path="/:campaignSlug" element={<App />} />
        
        {/* Specific Wiki Article Page */}
        <Route path="/:campaignSlug/:articleSlug" element={<App />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
