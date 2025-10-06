# The Circle - Comprehensive Productivity Platform

## Overview

The Circle is a full-stack web application designed to be a comprehensive productivity platform. It integrates habit tracking, motivational features, and community engagement to help users achieve their goals. Key capabilities include manual daily planning, focus mode, gamified habit formation, and a competitive battle system for user challenges. The platform aims to provide an immersive, supportive environment for personal growth and productivity.

## Recent Changes

**October 6, 2025** - Battle Invitation Notification System
- **Complete battle invitation flow with real-time notifications**
- New features:
  - NotificationBell component in top navigation with unread count badge
  - Real-time notification dropdown showing battle invitations
  - Accept/Decline buttons for pending battle invites
  - Automatic notification creation when battles are created
  - Creator notifications when battles are accepted/declined
  - Battle Participants section in Messages page for easy communication
- **Backend implementation**:
  - Notification schema added to shared/schema.ts
  - New endpoints: GET /api/notifications, PATCH /api/notifications/:id/read
  - New endpoints: PATCH /api/battles/:battleId/accept, PATCH /api/battles/:battleId/decline
  - Secure authorization checks (only invited participants can accept/decline)
  - Battle status validation (only pending battles can be accepted/declined)
- **Frontend implementation**:
  - NotificationBell auto-refreshes every 30 seconds
  - Messages page displays active battle participants at top
  - Proper loading states and error handling
  - Clean, intuitive UI with sword icons for battle-related items

**October 6, 2025** - Complete AI Feature Removal
- **All AI features have been permanently removed** at user request
- Platform is fully functional without any AI dependencies

## User Preferences

Preferred communication style: Simple, everyday language.

**Security Note**: API keys must be managed through Replit Secrets (environment variables), never through UI configuration.

## System Architecture

### Frontend Architecture

The frontend is built with React 18 and TypeScript, utilizing Wouter for lightweight routing and shadcn/ui (Radix UI primitives + Tailwind CSS) for accessible and customizable UI components. Tailwind CSS with CSS variables manages styling and theming, supporting a dark-mode-first design with a primary purple and secondary teal color scheme. TanStack Query handles server state management, and React Hook Form with Zod provides robust form validation. The architecture emphasizes mobile responsiveness, built with a mobile-first approach.

### Backend Architecture

The backend uses Node.js with TypeScript and Express.js. It follows a minimal backend approach with an `IStorage` interface for database agnosticism, currently using in-memory storage but configured for PostgreSQL migration via Drizzle ORM. API endpoints are RESTful, prefixed with `/api`. Shared TypeScript schemas between frontend and backend ensure type safety across the full stack.

### Authentication & Authorization

Firebase Authentication handles user authentication via email/password. JWT tokens are managed automatically by Firebase. A React Context API (`AuthContext`) maintains global authentication state, and `ProtectedRoute` components secure authenticated pages. User data is synced between Firebase Auth and Realtime Database for extended profile information.

### Data Storage

The primary database is Firebase Realtime Database, a NoSQL key-value store. Drizzle ORM is configured for a future PostgreSQL migration path. Zod schemas (`shared/schema.ts`) provide runtime validation and TypeScript typing for data models including User, MotivationalPost, PostLikes, UserStreak, Battle, and Notification. Critical operations like streak updates and like toggles use Firebase transactions (`runTransaction`) for atomic operations and to prevent race conditions.

### Build & Deployment

Development uses Vite for the frontend with HMR and `tsx` for the TypeScript server. Production builds optimize the frontend with Vite and bundle the backend with esbuild, resulting in a single Express server serving both the API and static files. The application is implemented as a Progressive Web App (PWA) with a manifest and service worker for cross-platform installation, offline support, and improved user experience.

### UI/UX Decisions

The platform features a bottom navigation for mobile, and a clear, modern aesthetic. The design includes a version footer and a comprehensive changelog page. A detailed documentation page with searchable sidebar navigation covers all platform features, complemented by a tabbed help and support center with an FAQ and support ticket submission.

### Feature Specifications

- **Manual Productivity Tools**: Daily planning with manual task creation, habit tracking, and focus mode with customizable timers.
- **Gamified Habits**: Habit tracking, goal setting, competitive battle system (1v1, group battles) with various challenge types, similarity-based matchmaking, real-time notification system for battle invitations, and a rarity-based badge system for achievements.
- **Community & Motivation**: Motivational posts with like functionality, user streaks, community engagement features, and private messaging with battle participant shortcuts.
- **Documentation & Support**: Comprehensive in-app documentation, searchable FAQ, and a support ticket system.

### Battle Invitation Flow

1. **Create Battle**: User creates a battle and invites another user → battle status set to "pending"
2. **Notification Sent**: Invited user receives real-time notification in NotificationBell
3. **Accept/Decline**: Invited user can accept or decline from notification dropdown
4. **Status Update**: 
   - Accept → battle becomes "active", creator receives notification
   - Decline → battle becomes "cancelled", creator receives notification
5. **Messaging**: Active battle participants appear in Messages "Battle Participants" section for easy communication

**Security**: Only invited participants (not creators) can accept/decline battles. All endpoints validate user authorization and battle status.

## External Dependencies

### Authentication & Database
- **Firebase**: Used for email/password authentication, Realtime Database (NoSQL), and Storage for file uploads. Essential for user management, streak tracking, motivational posts, and user data.
- **Neon Database (@neondatabase/serverless)**: Serverless PostgreSQL, configured with Drizzle ORM for a planned migration.

### UI Component Libraries
- **Radix UI**: Provides unstyled, accessible component primitives for the UI.
- **shadcn/ui**: Component system built on Radix UI and Tailwind CSS.

### Developer Tools (Replit specific)
- **Replit Plugins**: `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` (used in Replit development environment only).

### Key Packages
- **TanStack Query**: Server state management and caching.
- **React Hook Form**: Form management.
- **Zod**: Schema validation.
- **date-fns**: Date manipulation.
- **Tailwind CSS**: Utility-first styling.
- **wouter**: Lightweight client-side routing.
- **connect-pg-simple**: Configured for PostgreSQL session store (for future use).