# Worldbuilding Wiki

A React + Tailwind CSS starter for a dark fantasy worldbuilding wiki with diagetic sources, locked archives, and a library-inspired UI.

## What’s included
- Vite-powered React application
- Tailwind CSS with a dark fantasy design system
- Mocked sidebar navigation and search UI
- Article template with infobox and hover-ready source links
- Local `useAuth` hook scaffolding for login and invite-gated wikis

## Quick start

```bash
npm install
npm run dev
```

Open the local URL shown by Vite and explore the worldbuilding wiki interface.

## Project structure

- `src/App.tsx` — main layout and feature shell
- `src/components/Sidebar.tsx` — navigation and invite controls
- `src/components/SearchBar.tsx` — search field mockup
- `src/components/Infobox.tsx` — wiki quick facts panel
- `src/components/TooltipLink.tsx` — hoverable reference cards
- `src/components/ArticleEditor.tsx` — article creation and edit form
- `src/components/ArticleList.tsx` — campaign article list and management
- `src/hooks/useAuth.ts` — profile / invite stub logic
- `src/hooks/useCampaign.ts` — campaign article persistence and CRUD
- `TECHNICAL_BLUEPRINT.md` — architecture and feature plan

## Next steps

1. Add backend endpoints for persistent authentication and wiki storage
2. Implement router-driven page navigation
3. Expand the article editor and source relationship model
4. Add invite-code validation at the API level
