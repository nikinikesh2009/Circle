# The Circle - Comprehensive Productivity Platform

## Overview

The Circle is a full-stack web application that combines AI-powered productivity tools with habit tracking, motivation, and community engagement. The platform features intelligent daily planning, multimodal AI chat assistance, focus mode, and gamified habit formation to help users achieve their goals.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### October 2025: Documentation & Help/Support System
- **Documentation Page**: Created comprehensive documentation with searchable sidebar navigation covering all platform features
  - Sections: Getting Started, AI Chat Assistant, Daily Planner, Habits & Goals, Focus Mode, Community Features, PWA
  - Expandable content items with detailed explanations for each feature
  - Search functionality to find specific topics quickly
- **Help & Support Center**: Built tabbed help center with FAQ, documentation links, and contact support
  - Searchable FAQ organized by categories (Getting Started, AI Features, Habits, Focus, Community, Account)
  - Support ticket submission form with validation
  - Backend endpoint `/api/support/ticket` to handle support requests
  - Tickets stored in Firebase Realtime Database with sanitized inputs
- **Settings Integration**: Added quick links to Documentation and Help pages from Settings screen
- **Schema Updates**: Added SupportTicket schema to `shared/schema.ts` for type-safe ticket handling

### October 2025: PWA (Progressive Web App) Implementation
- **Cross-Platform Installation**: Converted The Circle into an installable PWA that works on all devices (iOS, Android, Windows, Mac, Linux)
- **App Manifest**: Created manifest.json with app metadata, theme colors (#7c3aed purple), and proper icon configuration
- **Service Worker**: Implemented offline support with runtime caching strategy for assets and pages
- **App Icons**: Generated PNG icons (192×192, 512×512) and Apple touch icon (180×180) using Sharp
- **Install Experience**: Users can now install the app from their browser and use it like a native application
- **Offline Capability**: App caches resources for offline access with intelligent fallback strategies

### October 2025: Enhanced Daily Planner & AI Features
- **Day Description Input**: Added textarea for users to describe their day before AI generates schedule
- **Task Editing**: Added Edit button to all tasks with full dialog for modifying title, description, category, priority, and times
- **Markdown Rendering**: Fixed AI chat responses to properly render markdown formatting (bold, italic, lists) with DOMPurify sanitization
- **AI Attribution**: Updated system prompt to identify as created by ACO Network, by Nikil Nikesh (Splash Pro)

### October 2025: Multimodal AI Chat Implementation
- **Full-Screen Chat Experience**: Transformed AI Chat into an immersive, edge-to-edge interface for distraction-free interaction
- **Multimodal File Support**: Added ability to upload and analyze images, audio files, and PDF documents
- **File Upload Integration**: Integrated Firebase Storage for secure file hosting with 10MB size limit
- **AI Vision & Analysis**: Connected Gemini 2.0 Flash Exp model for multimodal requests (text + files)
- **CORS-Free File Proxy**: Implemented server-side file proxy (`/api/proxy/file`) to bypass browser CORS restrictions
- **Security Hardening**: 
  - Validated all file URLs to only allow Firebase Storage sources (SSRF prevention)
  - Required complete file metadata (fileUrl, fileType, mimeType, fileName) for all uploads
  - Server-side MIME type validation against allowed formats
  - Added DOMPurify for sanitizing markdown HTML to prevent XSS attacks
- **Mobile Navigation**: Streamlined to bottom navigation only, removed hamburger menu
- **Daily Planner Mobile**: Fixed layout with stacked controls for better mobile experience

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React routing)
- **UI Components**: Radix UI primitives with shadcn/ui component system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation

**Design Decisions:**
- **Component Library Choice**: Uses shadcn/ui (Radix UI + Tailwind) for accessible, customizable components without heavy dependencies. Components are copied into the project rather than imported from a package, allowing full customization.
- **Routing Strategy**: Wouter chosen over React Router for its minimal footprint (~1.2KB) while providing essential routing capabilities.
- **Theme System**: Dark-mode-first design with CSS custom properties for colors, enabling easy theme switching. Primary color is purple (#7c3aed), secondary is teal, creating a modern, energetic aesthetic.
- **Mobile Responsiveness**: Built mobile-first with Tailwind's responsive utilities and custom mobile detection hooks.

**Directory Structure:**
```
client/
├── src/
│   ├── components/     # Reusable components
│   │   ├── ui/        # shadcn/ui component library
│   │   └── ProtectedRoute.tsx
│   ├── contexts/      # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions and configs
│   ├── pages/         # Page components
│   └── App.tsx        # Main application component
```

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Build Tool**: Vite for development, esbuild for production
- **Type Safety**: Shared TypeScript schemas between frontend and backend

**Design Decisions:**
- **Minimal Backend Approach**: Currently uses in-memory storage (`MemStorage`) as a placeholder. The architecture is designed to be database-agnostic with a storage interface pattern.
- **API Design**: RESTful endpoints prefixed with `/api`. Logging middleware captures request/response for debugging.
- **Development Experience**: Vite's HMR in middleware mode provides instant feedback during development.
- **Storage Interface Pattern**: `IStorage` interface defines CRUD operations, allowing easy swapping between in-memory, PostgreSQL, or other storage backends without changing business logic.

**Server Structure:**
```
server/
├── index.ts      # Express app setup and middleware
├── routes.ts     # API route definitions
├── storage.ts    # Storage interface and implementations
└── vite.ts       # Vite dev server integration
```

### Authentication & Authorization

**Current Implementation:**
- **Provider**: Firebase Authentication
- **Strategy**: Email/password authentication
- **Session Management**: Firebase handles JWT tokens automatically
- **User Context**: React Context API (`AuthContext`) manages authentication state globally
- **Protected Routes**: `ProtectedRoute` component wraps authenticated pages, redirecting unauthorized users

**Design Rationale:**
- Firebase chosen for rapid development and built-in security features
- Authentication logic separated from business logic through context pattern
- User data synced between Firebase Auth and Realtime Database for extended profile information

### Data Storage

**Current State:**
- **Primary Database**: Firebase Realtime Database (NoSQL, key-value tree structure)
- **Fallback**: In-memory storage for backend operations (placeholder)
- **ORM Configuration**: Drizzle ORM configured for PostgreSQL migration path
- **Schema Management**: Zod schemas in `shared/schema.ts` provide runtime validation and TypeScript types

**Data Models:**
1. **User Schema** (`users/{userId}`):
   - Core fields: email, createdAt (ISO string)
   - Gamification: streak, bestStreak, totalDays, lastCompletedDate (YYYY-MM-DD)
   - Social: likesGiven counter

2. **MotivationalPost Schema** (`motivationalPosts/{postId}`):
   - Content and optional image URL
   - Category classification
   - Like counter and timestamps (ISO strings)

3. **PostLikes Schema** (`postLikes/{userId}_{postId}`):
   - Tracks individual user likes on posts
   - userId, postId, createdAt (ISO string)

4. **UserStreak Schema** (`userStreaks/{userId}-{date}`):
   - Links users to their daily streak records
   - userId, date, completed boolean, createdAt

**Design Decisions:**
- **Firebase Realtime Database Migration** (October 2025): Migrated from Firestore to Realtime Database for simpler setup and easier deployment on Replit
- **Atomic Operations**: All critical operations (streak updates, like/unlike) use Firebase transactions (`runTransaction`) to prevent race conditions and duplicate counts under concurrent usage
- **Transaction Safety**: 
  - Streak updates check `lastCompletedDate` inside transaction to prevent duplicate increments
  - Like toggles use transaction on like entry node to atomically create/delete, then update counters
- Schema-first design ensures type safety across the entire stack
- Shared schemas between frontend/backend eliminate type mismatches

### Build & Deployment

**Development:**
- Vite dev server with HMR for frontend
- tsx for running TypeScript server code without compilation
- Concurrent development: Vite serves React app while Express handles API

**Production:**
- Frontend: Vite builds optimized bundle to `dist/public`
- Backend: esbuild bundles server to `dist/index.js` with ESM format
- Single production command runs bundled Express server serving both API and static files

**Scripts:**
- `dev`: Development mode with hot reload
- `build`: Production build for both frontend and backend
- `start`: Production server
- `db:push`: Drizzle schema migration

## External Dependencies

### Authentication & Database
- **Firebase**: Provides authentication (email/password), Realtime Database, and Storage
  - Configuration: Environment variables for API key, project ID, app ID, and database URL
  - Authentication: Email/password sign-in method
  - Database: Firebase Realtime Database (NoSQL tree structure)
  - Storage: Firebase Storage for file uploads (images, audio, documents)
  - Used for user management, streak tracking, motivational posts, like system, and chat file attachments
  - **Important**: Requires database rules set to test mode for development (see README setup instructions)

### AI Integration
- **Google Gemini**: Powers AI features with multimodal capabilities
  - Model: Gemini 2.0 Flash Exp for multimodal chat (images, audio, PDFs)
  - Model: Gemini 2.5 Flash for text-only AI features (daily planning, habit nudges)
  - Features:
    - Multimodal chat with image analysis, audio transcription, and document understanding
    - AI-powered daily schedule generation
    - Smart habit nudges with customizable personality styles
    - Task optimization and micro-goal generation
  - Configuration: Requires `GEMINI_API_KEY` environment variable

### Database (Planned Migration)
- **Neon Database**: Serverless PostgreSQL (@neondatabase/serverless)
  - Drizzle ORM configured to use Neon via `DATABASE_URL` environment variable
  - Migration files in `/migrations` directory
  - Suggests future migration from Firestore to relational database

### UI Component Libraries
- **Radix UI**: Unstyled, accessible component primitives
  - ~30 component libraries imported (accordion, dialog, dropdown, etc.)
  - Provides accessibility, keyboard navigation, and ARIA attributes out-of-box

### Developer Tools
- **Replit Plugins**: 
  - `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
  - `@replit/vite-plugin-cartographer`: Code mapping
  - `@replit/vite-plugin-dev-banner`: Development environment indicator
  - Only loaded in Replit development environment

### Key Packages
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management with minimal re-renders
- **Zod**: Schema validation for forms and API data
- **date-fns**: Date manipulation and formatting
- **Tailwind CSS**: Utility-first styling with PostCSS
- **wouter**: Lightweight routing (~1.2KB alternative to React Router)

### Session Management (Backend Ready)
- **connect-pg-simple**: PostgreSQL session store for Express
  - Configured but not actively used (in-memory storage current)
  - Ready for production session persistence when PostgreSQL is activated