# The Circle - Comprehensive Productivity Platform

## Overview

The Circle is a full-stack web application designed to be a comprehensive productivity platform. It integrates habit tracking, motivational features, and community engagement to help users achieve their goals. Key capabilities include manual daily planning, focus mode, gamified habit formation, and a competitive battle system for user challenges. The platform aims to provide an immersive, supportive environment for personal growth and productivity.

## Recent Changes

**October 6, 2025** - Complete AI Feature Removal
- **All AI features have been permanently removed** at user request
- Removed features:
  - AI Chat assistant page (deleted entirely)
  - AI schedule generation in Planner (users now create schedules manually)
  - AI habit nudges (removed from habits page)
  - AI-powered settings and preferences (removed from settings)
  - AI matchmaking for battles (replaced with simple similarity-based matching)
  - AI Manager Control Panel from dashboard
  - AI daily insights
- **Backend cleanup**:
  - Removed all AI endpoints from server/routes.ts
  - Removed AI schemas from shared/schema.ts
  - Removed AI storage methods from server/storage.ts
  - Uninstalled openai, marked, and isomorphic-dompurify packages
- **Frontend cleanup**:
  - Removed chat route and navigation from App.tsx and BottomNav.tsx
  - Updated all help documentation to remove AI references
  - Replaced AI Chat with Messages in bottom navigation
- **Simple fallback algorithms**: Battle matchmaking now uses stat similarity instead of AI
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

The primary database is Firebase Realtime Database, a NoSQL key-value store. Drizzle ORM is configured for a future PostgreSQL migration path. Zod schemas (`shared/schema.ts`) provide runtime validation and TypeScript typing for data models including User, MotivationalPost, PostLikes, and UserStreak. Critical operations like streak updates and like toggles use Firebase transactions (`runTransaction`) for atomic operations and to prevent race conditions.

### Build & Deployment

Development uses Vite for the frontend with HMR and `tsx` for the TypeScript server. Production builds optimize the frontend with Vite and bundle the backend with esbuild, resulting in a single Express server serving both the API and static files. The application is implemented as a Progressive Web App (PWA) with a manifest and service worker for cross-platform installation, offline support, and improved user experience.

### UI/UX Decisions

The platform features a bottom navigation for mobile, and a clear, modern aesthetic. The design includes a version footer and a comprehensive changelog page. A detailed documentation page with searchable sidebar navigation covers all platform features, complemented by a tabbed help and support center with an FAQ and support ticket submission.

### Feature Specifications

- **Manual Productivity Tools**: Daily planning with manual task creation, habit tracking, and focus mode with customizable timers.
- **Gamified Habits**: Habit tracking, goal setting, competitive battle system (1v1, group battles) with various challenge types, similarity-based matchmaking, and a rarity-based badge system for achievements.
- **Community & Motivation**: Motivational posts with like functionality, user streaks, community engagement features, and private messaging.
- **Documentation & Support**: Comprehensive in-app documentation, searchable FAQ, and a support ticket system.

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