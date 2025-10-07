# The Circle - Comprehensive Productivity Platform

## Overview

The Circle is a full-stack web application designed to be a comprehensive productivity platform. It integrates habit tracking, motivational features, and community engagement to help users achieve their goals. Key capabilities include manual daily planning, focus mode, gamified habit formation, and a competitive battle system for user challenges. The platform aims to provide an immersive, supportive environment for personal growth and productivity.

## Recent Changes

**October 7, 2025** - Long-Press Context Menus & Comprehensive Visual Polish
- **Implemented long-press context menus with full mobile support**
  - Created reusable `useLongPress` hook supporting mobile touch and desktop mouse events
  - Touch-based long-press: 500ms delay triggers context menu on mobile devices
  - Synthetic contextmenu MouseEvent dispatched for Radix UI ContextMenu compatibility
  - Cleanup listeners (touchend/touchmove with {once: true}) prevent false triggers
  - Planner tasks: Edit, Delete, Duplicate, Complete, Change Priority
  - Habits: Edit, Delete, View Stats, Reset Streak (with click guard to prevent completion toggle)
  - Battles: View Details, Report Progress, Leave/Cancel Battle
  - Community posts: Edit/Delete own, Share, Copy Link, Report others
  - Context menus use shadcn ContextMenu component with asChild prop for proper event delegation
- **Click Guard Implementation (Habits)**
  - Atomic flag check-and-reset pattern prevents completion toggle when opening context menu
  - `const wasLongPress = longPressTriggered; setLongPressTriggered(false);` eliminates race conditions
  - Long-press opens menu without triggering card's onClick handler
- **Comprehensive visual enhancements**
  - Glassmorphism effects (`.glass`, `.glass-strong`) for modern card designs
  - Professional card shadows with hover-lift animations
  - Smooth transitions and animations: float, slide-in, scale-in
  - Button shine effects for interactive elements
  - Shimmer loading animations for skeleton screens
  - Enhanced badge glow effects with gradient borders
  - Context menu entrance animations
  - Improved focus states with primary color outlines
- **Benefits**
  - Mobile-first interactions with long-press menus across all features
  - Professional, polished appearance with smooth animations
  - No UX conflicts between long-press and click interactions
  - Consistent design language throughout the platform
  - Dark mode support for all new visual effects

**October 7, 2025** - Professional Feature-Based Architecture Reorganization
- **Reorganized codebase into professional feature-based structure**
- Client-side structure:
  - `client/src/features/` - All features organized in self-contained folders: auth, dashboard, ai-assistant, planner, habits, battles, community, profile, settings, admin, info
  - Each feature contains: `pages/`, `components/`, `hooks/` subdirectories
  - `client/src/shared/` - Shared code: components, hooks, lib, contexts
  - `client/src/components/ui/` - shadcn UI components (preserved for compatibility)
- Server-side improvements:
  - Moved middleware to `server/shared/middleware/`
  - Centralized authentication and rate limiting middleware
- Import path updates:
  - All imports updated to use `@/shared/` and `@/features/` prefixes
  - shadcn UI components use `@/components/ui/` prefix
  - Updated `components.json` configuration
- Benefits:
  - Clear feature boundaries and separation of concerns
  - Easier to add/remove features
  - Better scalability and team collaboration
  - Improved code organization and maintainability

**October 7, 2025** - Critical Bug Fixes & Mobile Navigation Enhancement
- **Fixed Firebase Storage Configuration**
  - Corrected storage bucket URL to circle-classroom.appspot.com
  - Resolved all media upload failures
  - Images now upload successfully to Firebase Storage
- **Enhanced Post Creation Validation**
  - Added content length validation (min 10 chars)
  - Required content or image (cannot post empty)
  - Improved error handling and user feedback
  - Fixed post submission flow
- **Fixed Battle Creation Issues**
  - Added custom challenge requirements validation
  - Implemented date validation (future dates only)
  - Added self-battle prevention
  - Enhanced user lookup error handling
  - All battle types now work correctly
- **Improved Mobile Navigation**
  - Replaced center navigation button with dropdown menu
  - Added Popover menu with all 9 features
  - Features: Dashboard, AI Chat, Battles, Community, Planner, Habits, Groups, Profile, Help
  - Fixed SPA routing (wouter setLocation instead of window.location)
  - Smooth navigation without page reloads
- **Service Worker Cache Fixes**
  - Upgraded to v3 with aggressive cache clearing
  - Network-first fetch strategy
  - Eliminated stale JavaScript issues
  - Clean browser console (no errors)

**October 6, 2025** - DeepSeek AI Integration & Smart Command Recognition
- **Integrated DeepSeek AI as productivity assistant**
- Messages page transformed into dedicated AI chat interface
- Features:
  - Full-screen AI chat interface powered by DeepSeek
  - Smart command recognition for productivity features
  - Commands: "Discuss the day", "Check my productivity", "Create tasks", "Get motivated"
  - Proactive AI that asks about progress and obstacles
  - Task suggestion system with user confirmation
  - AI personality customization (Professional, Friendly, Motivating, Coach)
  - Custom system prompt support
  - Settings toggle for task suggestions and productivity check-ins
- **Backend implementation**:
  - DeepSeek API integration via OpenAI-compatible SDK
  - Enhanced system prompts with command recognition
  - Context-aware responses based on user streaks, tasks, habits
  - Task suggestion parsing and creation flow
  - Secure API key management via Replit Secrets
- **Frontend implementation**:
  - Clean, modern chat interface with gradient design
  - Quick action buttons for common commands
  - Task suggestion cards with confirm/decline actions
  - Real-time message updates
  - Loading states and error handling
  - Settings dialog for AI customization

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

- **AI Productivity Assistant**: DeepSeek-powered chat interface for productivity guidance, smart command recognition, task planning, productivity check-ins, and personalized motivation. Supports multiple personality modes and custom system prompts.
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

### AI Services
- **DeepSeek AI**: Powers the productivity assistant chat interface. Provides intelligent task planning, productivity insights, and personalized coaching. API key managed via Replit Secrets (DEEPSEEK_API_KEY).

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