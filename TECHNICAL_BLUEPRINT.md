# Worldbuilding Wiki Technical Blueprint

## Overview
This project is an initial React + Tailwind CSS boilerplate for a Dark Fantasy / Steampunk worldbuilding wiki.
The concept supports:
- diagetic source relationships: Primary Sources and Compendiums
- hoverable link previews for locations, characters, and documents
- locked wiki sections gated by GM-issued invite codes
- login/profile support for contributors and worldbuilders
- responsive layout with a library-inspired dark aesthetic

## Information Architecture

### Primary Content Types
- `Primary Source`
  - First-hand artifacts or narratives cited within compendium entries
  - Example: ritual scrolls, eyewitness letters, mythic transcripts
- `Compendium`
  - Aggregated lore pages that cite primary sources to provide context
  - Example: political court entries, world history overviews, faction studies

### Navigation and Relationships
- Sections are surfaced in a dynamic sidebar:
  - Overview
  - Primary Sources
  - Compendiums
  - Characters
  - Locked archives
- Content blocks expose inline references using `TooltipLink` components
- Hovering a linked entity reveals quick contextual text
- Clicking a link navigates to the related diagetic entry

## UI/UX Design

### Aesthetic
- Dark mode by default
- Base palette: deep charcoals, brass highlights, smoky stone tones
- Elegant serif typography: Cinzel and Playfair Display for headings and body
- Monospace accent text for system labels and code-inspired UI elements
- Visual metaphor: a grand library with vellum panels and brass filigree

### Core Layout
- Responsive two-column desktop layout
  - Left sidebar for navigation, search, and profile/auth controls
  - Main content area for article display and infobox metadata
- Mobile-first adjustments to preserve readability
- Infobox panel modeled after wiki quick facts
- Search mockup included for future full-text search

## Frontend Architecture

### Technology Stack
- React 18
- Tailwind CSS 3
- Vite bundler
- TypeScript for typed component interfaces

### File Structure
- `src/App.tsx` — main shell and interaction scaffold
- `src/components/Sidebar.tsx` — navigation and invite generation UI
- `src/components/SearchBar.tsx` — search field mockup
- `src/components/Infobox.tsx` — wiki quick facts panel
- `src/components/TooltipLink.tsx` — hoverable diagetic references
- `src/components/ArticleEditor.tsx` — article creation and edit form
- `src/components/ArticleList.tsx` — campaign article management
- `src/hooks/useAuth.ts` — basic auth state and invite gating
- `src/hooks/useCampaign.ts` — campaign article persistence and CRUD
- `src/types.ts` — shared type definitions

### Authentication and Locking
The current boilerplate uses a local-storage-based auth stub to simulate:
- login/register profile creation
- persistent user session
- invite code generation and unlock flow
- gated wiki access via invite codes

This can be replaced with a backend service for production use.

## Backend Blueprint

### Recommended Stack
- Node.js / TypeScript
- Express or Fastify
- PostgreSQL or SQLite for early development
- ORM: Prisma or TypeORM
- Authentication: JWT tokens or session cookies

### Core Domain Models
- `User`
  - username
  - email (optional)
  - passwordHash
  - role: `gm | contributor | reader`
  - unlockedWikiIds
- `Wiki`
  - title
  - slug
  - type: `compendium | primary-source | character`
  - status: `public | locked`
  - gmInviteCode
- `Article`
  - wikiId
  - summary
  - content
  - metadata
  - linkedEntities
- `LinkPreview`
  - label
  - targetType
  - description

### API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/wikis`
- `GET /api/wikis/:slug`
- `POST /api/wikis/:slug/unlock`
- `POST /api/wikis/:slug/invite`
- `GET /api/sources`
- `GET /api/characters`

### Invite Code Flow
1. GM creates or publishes a locked wiki
2. Backend generates a one-time invite code and stores a secure hash
3. Trusted contributors submit the invite code to unlock access
4. Backend validates the code and grants the user access to the locked wiki

### Access Control
- Public wikis are visible to all logged-in users
- Locked wikis require direct authorization
- GM accounts can manage invite codes and grant/revoke access

## Next Development Steps

1. Add React Router to support paged navigation for individual wiki entries
2. Replace mock data with API calls
3. Build a backend service with user session handling and invite code verification
4. Extend the article editor for GM-managed compendiums
5. Add comments, revision history, or collaborative worldbuilding features
6. Enhance search with filters for sources, locations, and characters

## Notes
This boilerplate is intentionally structured to support the requested feature set while leaving room for backend integration and future worldbuilding-specific improvements.
