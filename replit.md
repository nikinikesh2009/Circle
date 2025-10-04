# The Circle - Daily Motivation and Habit Tracking Application

## Overview

The Circle is a full-stack web application designed to help users build better habits through daily motivation, streak tracking, and community engagement. The platform provides inspirational content, gamifies habit formation through streak counters, and connects users with a supportive community.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- User data synced between Firebase Auth and Firestore for extended profile information

### Data Storage

**Current State:**
- **Primary Database**: Firestore (Firebase's NoSQL database)
- **Fallback**: In-memory storage for backend operations (placeholder)
- **ORM Configuration**: Drizzle ORM configured for PostgreSQL migration path
- **Schema Management**: Zod schemas in `shared/schema.ts` provide runtime validation and TypeScript types

**Data Models:**
1. **User Schema**:
   - Core fields: id, email, createdAt
   - Gamification: streak, bestStreak, totalDays, lastCompletedDate
   - Social: likesGiven counter

2. **MotivationalPost Schema**:
   - Content and optional image URL
   - Category classification
   - Like counter and timestamps

3. **UserStreak Schema** (partial):
   - Links users to their streak records
   - Supports historical tracking

**Design Decisions:**
- Firestore selected for real-time capabilities and Firebase ecosystem integration
- Drizzle ORM present suggests planned migration to PostgreSQL for relational data needs
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
- **Firebase**: Provides authentication (email/password) and Firestore database
  - Configuration: Environment variables for API key, project ID, app ID
  - Used for user management and real-time data storage

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