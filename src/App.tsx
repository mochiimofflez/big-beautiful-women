<<<<<<< HEAD
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { WikiView } from './pages/WikiView';
import { EditorPage } from './pages/EditorPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
=======
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { Infobox } from './components/Infobox';
import { ArticleList } from './components/ArticleList';
import { ArticleEditor } from './components/ArticleEditor';
import { AuthFrame } from './components/AuthFrame';
import { useAuth } from './hooks/useAuth';
import { useCampaign } from './hooks/useCampaign';
import type { ArticleData } from './types';
>>>>>>> be23207628f08b7617c830fb2041b59a752d65d9

export function App() {
  return (
<<<<<<< HEAD
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/Campaigns/:campaignId" element={<WikiView />} />
      <Route path="/Campaigns/:campaignId/:articleId" element={<WikiView />} />
      <Route path="/Campaigns/:campaignId/editor" element={<EditorPage />} />
      <Route path="/Campaigns/:campaignId/editor/:articleId" element={<EditorPage />} />
      <Route path="/Users/:userId" element={<ProfilePage />} />
      <Route path="/Admin" element={<AdminPage />} />
    </Routes>
=======
    <div className="min-h-screen bg-charcoal text-stone">
      <ArticleEditor 
        open={editorOpen} 
        article={editorArticle} 
        author={auth.user?.username ?? 'Unknown'} 
        onSave={handleSaveArticle} 
        onClose={closeEditor} 
      />

      <AuthFrame
        show={auth.showLogin}
        mode={auth.authMode}
        username={auth.username}
        password={auth.password}
        inviteInput={auth.inviteInput}
        authMessage={auth.authMessage}
        onClose={() => auth.toggleLoginForm(auth.authMode)}
        onToggleMode={() => auth.setAuthMode(auth.authMode === 'signin' ? 'signup' : 'signin')}
        onUsernameChange={auth.setUsername}
        onPasswordChange={auth.setPassword}
        onInviteInputChange={auth.setInviteInput}
        onSubmit={auth.handleLogin}
      />

      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        {/* Navigation Sidebar */}
        <aside className="shrink-0 border-r border-brass/10 bg-[#101010] p-6 lg:w-[320px]">
          <Link to="/" className="block mb-8 rounded-3xl border border-brass/15 bg-[#0d0b0b] p-6 shadow-library hover:border-brass/40 transition-all">
            <div className="mb-4 text-xs uppercase tracking-[0.35em] text-brass/70">Grand Library</div>
            <h1 className="font-display text-2xl font-semibold text-amber-200 leading-tight">{currentCampaign?.title ?? 'Worldbuilding Wiki'}</h1>
            <p className="mt-3 text-xs leading-5 text-stone/80 italic">Click to return to Repository Hub</p>
          </Link>

          <SearchBar query={query} onSearch={setQuery} />

          <div className="mt-8 space-y-4">
            <Sidebar
              sections={sectionOptions}
              activeSection={activeSection}
              onSelect={setActiveSection}
              canViewLocked={auth.unlockedWikis.includes('iron-court')}
              onUnlockWiki={auth.unlockWiki}
              inviteCode={auth.inviteCode}
              generateInviteCode={auth.generateInviteCode}
            />
          </div>

          {/* User Session Panel */}
          <div className="mt-8 rounded-3xl border border-brass/10 bg-[#0d0b0b] p-6 text-sm text-stone/80 shadow-library">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-brass/70">
              <span>Session</span>
              <span className="rounded-full border border-brass/20 bg-soot px-2 py-1 text-[10px] uppercase">
                {auth.user ? 'Logged In' : 'Guest'}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {auth.user ? (
                <>
                  <div className="text-sm font-semibold text-amber-200">{auth.user.username}</div>
                  <div className="text-xs uppercase tracking-[0.35em] text-brass/70">Role</div>
                  <p className="text-sm leading-6 text-stone/70">{auth.user.role === 'gm' ? 'Game Master' : 'Reader'}</p>
                  <button
                    className="mt-4 w-full rounded-2xl border border-brass/30 bg-brass/10 px-4 py-2 text-sm text-brass transition hover:bg-brass/20"
                    onClick={auth.logout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="w-full rounded-2xl border border-brass/30 bg-brass/10 px-4 py-2 text-[10px] uppercase tracking-widest text-brass transition hover:bg-brass/20"
                    onClick={() => auth.toggleLoginForm('signin')}
                  >
                    Sign In
                  </button>
                  <button
                    className="w-full rounded-2xl border border-brass/30 bg-brass/10 px-4 py-2 text-[10px] uppercase tracking-widest text-brass transition hover:bg-brass/20"
                    onClick={() => auth.toggleLoginForm('signup')}
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>

        </aside>

        <main className="flex-1 p-6 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
            <section className="space-y-8 rounded-3xl border border-brass/10 bg-[#0d0b0b] p-8 shadow-library">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brass/70">Archive Record</p>
                  <h2 className="mt-2 text-3xl font-semibold text-amber-100">{activeArticle?.title ?? 'No article selected'}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-stone/70">
                    {activeArticle?.summary ?? 'Use the manager to create or select an article to display here.'}
                  </p>
                </div>
                {canManage ? (
                  <button
                    className="rounded-2xl border border-brass/20 bg-brass/10 px-4 py-3 text-sm text-brass transition hover:bg-brass/20"
                    onClick={() => openEditor(null)}
                  >
                    Create Article
                  </button>
                ) : null}
              </div>

              {activeArticle ? (
                <article className="space-y-8">
                  {activeArticle.body.map((block) => (
                    <div key={block.title} className="space-y-4">
                      <h3 className="text-xl font-semibold text-stone-100">{block.title || 'Untitled section'}</h3>
                      <p className="max-w-3xl leading-8 text-stone/70">{block.content}</p>
                    </div>
                  ))}
                </article>
              ) : (
                <div className="rounded-3xl border border-brass/10 bg-charcoal/80 p-6 text-sm text-stone/70">
                  Select an article from the campaign list to begin.
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <Infobox metadata={activeArticle?.infobox ?? []} />

              <ArticleList
                articles={visibleArticles}
                activeArticleId={activeArticle?.id ?? null}
                selectedSection={activeSection}
                query={query}
                canManage={canManage}
                onSelect={handleSelectArticle}
                onEdit={(article) => openEditor(article)}
                onDelete={campaignManager.deleteArticle}
                onToggleHidden={campaignManager.toggleHidden}
              />
            </aside>
          </div>
        </main>
      </div>
    </div>
>>>>>>> be23207628f08b7617c830fb2041b59a752d65d9
  );
}
