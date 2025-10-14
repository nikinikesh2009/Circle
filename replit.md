# Circle PWA - Social Communities Platform

## Overview
Circle is a production-grade Progressive Web App for creating and managing interest-based communities with real-time chat, AI assistance, and push notifications.

## Recent Changes (October 2025)
- ✅ Implemented database schema with users, circles, messages, and memberships
- ✅ Added authentication system with Passport.js and PostgreSQL session store
- ✅ Built circles CRUD API (create, join, leave, list)
- ✅ Integrated frontend with authentication and circles management
- ✅ Real-time messaging with WebSocket (complete)
- ✅ AI assistant integration with GPT-5 (complete)
- ✅ PWA service worker with offline support (complete)
- ✅ In-app notification system with real-time updates (complete)

### Latest Updates (October 14, 2025)
- ✅ **Mobile-First Layout System Refactor** (Production-Ready):
  - **Deleted broken ContentContainer** - Caused left-alignment issues on mobile
  - **Refactored Layout.tsx with PageShell pattern** - Centralized responsive layout logic
  - **Responsive padding scale**: `px-4 sm:px-6 lg:px-8` for mobile → tablet → desktop
  - **Max-width constraints**: `max-w-7xl mx-auto` for desktop centering (1280px)
  - **All 7 pages updated**: Home, Explore, Profile, Support, AI, DirectMessages, UserProfile
  - **Full-screen chat mode**: Layout detects `/chat/:id` and `/dm/:id` routes, hides AppSidebar
  - **Chat pages**: Own internal circle list sidebar, full-width immersive experience
  - **No edge-touching content**: Proper safe-area padding on all screen sizes
  - **No layout shift**: Consistent spacing between page transitions
  - **Comprehensive testing**: Verified mobile (375px), tablet (768px), desktop (1440px) layouts
- ✅ **Purple Color Scheme** (Production-Ready):
  - Changed theme from blue to purple (hue 270) across all primary colors
  - Updated all CSS variables in index.css for consistent purple branding
  - Glass effect on bottom navigation with backdrop-blur and semi-transparent background
  - Bottom nav icons centered with proper spacing (gap-2) for cleaner mobile UX
- ✅ **Profile System with Bio and Targets** (Production-Ready):
  - Added `targets` text array field to users schema for user goals/objectives
  - Profile editing dialog allows users to update name, bio, and add/remove targets
  - PATCH /api/user/profile endpoint with validation and password stripping
  - Auth context now includes `refreshUser()` function to sync profile updates
  - Profile mutations immediately refresh user data for real-time UI updates
  - Targets displayed as badges on profile with proper responsive layout
- ✅ **User Profile View & Navigation** (Production-Ready):
  - Created `/user/:userId` route for viewing other users' profiles
  - GET /api/users/:id endpoint with auth protection for fetching user data
  - Displays avatar, name, username, bio, and targets with "Send Message" DM button
  - Clickable usernames in chat messages and DM conversations
  - Navigation guards prevent clicks on system messages (undefined sender IDs)
  - Safe routing with proper error handling for missing or invalid user IDs
- ✅ **UI/UX Polish**:
  - Simplified navigation structure (sidebar shows AI Assistant and Help only)
  - Removed duplicate menu items between sidebar and bottom nav
  - All layout issues resolved - content properly centered and responsive
  - Consistent purple theme across buttons, badges, and interactive elements

### Previous Updates (October 13, 2025)
- ✅ **Official Circles & Home/Explore Separation** (Production-Ready):
  - Added `isOfficial` flag to circles schema (default: false)
  - Created 7 official circles as seed data (AI & Tech, Python, Gaming, Music, Books, Movies, Sports)
  - Home page shows ONLY official circles for everyone
  - Explore page shows ONLY user-created circles (non-official, not yet joined)
  - Clear separation between official/common content and user-generated content
- ✅ **Direct Messaging System** (Production-Ready):
  - Implemented DM schema with `conversations` and `dm_messages` tables
  - Unique index on participant pair (LEAST/GREATEST) prevents duplicate conversations
  - Check constraint prevents self-messaging
  - Storage methods: getOrCreateConversation, getUserConversations, sendDmMessage, getDmMessages
  - API routes with participant authorization: POST/GET /api/dm/conversations, POST/GET /api/dm/conversations/:id/messages
  - Security: All DM routes verify user is conversation participant before allowing access
  - Fixed critical authorization vulnerability preventing unauthorized access to conversations
- ✅ **Unified Layout Structure**:
  - Created single Layout component wrapping all protected routes
  - Standardized content padding (p-4 lg:p-6) across all pages
  - Fixed bottom navigation with consistent labels (Home, Explore, Chat, Profile)
  - Theme toggle accessible on both mobile and desktop
  - AI FAB uses SPA navigation without page reloads
  - No vertical shifting between pages
- ✅ **Navigation Bar Alignment Fix**:
  - Fixed top navbar with justify-between flex layout
  - Mobile: SidebarTrigger + Logo + "Circle" on left, NotificationBell + ThemeToggle on right
  - Desktop: Logo + "Circle" on left, NotificationBell + ThemeToggle on right
  - Full width (w-full) with proper padding (px-4 py-2)
  - No empty space on right side, visually centered and responsive
- ✅ **Mobile Chat Enhancements**:
  - Message reactions system with emoji support (👍❤️😂😮🎉🔥)
  - Long-press context menu for edit/delete on mobile
  - Message editing with real-time sync across clients
  - Soft deletion with "Message deleted" placeholder
  - Reactions stored with composite PK (message_id, user_id, emoji)
  - All features tested end-to-end and verified working
- ✅ **Chat Layout & Media Improvements**:
  - Fixed full-width layout - content now fills entire screen
  - Sticky chat input bar stays at bottom while scrolling
  - Added media attachment buttons (image, file, audio pickers)
  - Proper mobile spacing to prevent BottomNav overlap (mb-16)
  - All media buttons functional with file selection dialogs
- Fixed critical notification system bugs:
  - Added WebSocket import for server-side notification broadcasting
  - Fixed unread count to use SQL COUNT() aggregate for accurate counts
  - Implemented DB-level authorization for notification mutations
  - Fixed circle member count to use SQL COUNT() aggregate
- All notification and mobile features now fully functional and tested

## Project Architecture

### Frontend (React + Vite)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: 
  - React Query for server state
  - React Context for auth state
  - Local state with useState/useReducer
- **UI**: Tailwind CSS + Shadcn UI components
- **Layout System**: 
  - ContentContainer component (max-w-800px mobile, 1200px desktop, centered)
  - Full-width chat/DM pages with hidden navigation
  - Responsive navigation (sidebar on desktop, bottom nav on mobile)
- **Theme**: Dark mode by default with light mode toggle
- **Pages**:
  - `/login`, `/signup` - Authentication
  - `/` - Home/Circles dashboard (centered)
  - `/explore` - User circles (centered)
  - `/chat/:id` - Real-time messaging (full-width)
  - `/dm` - Direct messages list (centered)
  - `/dm/:id` - DM chat (full-width)
  - `/ai` - AI Assistant (centered)
  - `/profile` - User profile (centered)
  - `/user/:id` - View user profile (centered)
  - `/support` - Help & FAQ (centered)

### Backend (Express + PostgreSQL)
- **Runtime**: Node.js with TypeScript
- **Database**: Neon PostgreSQL via Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **Session Store**: PostgreSQL (connect-pg-simple)
- **Real-time**: WebSocket server for chat
- **API Routes**:
  - `POST /api/auth/signup` - Create new user
  - `POST /api/auth/login` - Login
  - `POST /api/auth/logout` - Logout
  - `GET /api/auth/me` - Get current user
  - `GET /api/circles` - List all circles
  - `GET /api/circles/official` - Get official circles
  - `GET /api/circles/explore` - Get user-created circles (not joined)
  - `GET /api/circles/my` - Get user's circles
  - `POST /api/circles` - Create circle
  - `POST /api/circles/:id/join` - Join circle
  - `POST /api/circles/:id/leave` - Leave circle
  - `GET /api/circles/:id/messages` - Get messages
  - `PATCH /api/messages/:id` - Edit message
  - `DELETE /api/messages/:id` - Delete message (soft delete)
  - `GET /api/messages/:id/reactions` - Get message reactions
  - `POST /api/messages/:id/reactions` - Add reaction
  - `DELETE /api/messages/:id/reactions/:emoji` - Remove reaction
  - `POST /api/dm/conversations` - Create/get conversation with another user
  - `GET /api/dm/conversations` - Get user's all conversations
  - `POST /api/dm/conversations/:id/messages` - Send a DM message
  - `GET /api/dm/conversations/:id/messages` - Get DM messages
  - `GET /api/users/:id` - Get user profile by ID (auth required)
  - `PATCH /api/user/profile` - Update current user's profile (name, bio, targets)

### Database Schema
- **users**: id, email, password (hashed), name, username, avatar, bio, targets (text array), status, created_at
- **circles**: id, name, description, cover_image, category, is_private, is_official, created_by, member_count, created_at
- **circle_members**: circle_id, user_id, role, joined_at (composite PK)
- **messages**: id, circle_id, user_id, content, is_edited, is_deleted, created_at
- **reactions**: message_id, user_id, emoji, created_at (composite PK on message_id, user_id, emoji)
- **notifications**: id, user_id, type, title, message, link, read, created_at
- **conversations**: id, user_1_id, user_2_id, created_at (unique index on LEAST/GREATEST pair)
- **dm_messages**: id, conversation_id, sender_id, content, created_at

### Security
- Passwords hashed with bcryptjs (10 rounds)
- Sessions stored in PostgreSQL (persistent across restarts)
- SESSION_SECRET required in production
- Protected routes with authentication middleware
- HttpOnly cookies with 7-day expiration

## User Preferences
- Mobile-first responsive design
- Dark mode as default theme
- Clean, modern UI inspired by Discord/Linear
- Emphasis on community engagement and real-time interaction

## Environment Variables
Required secrets:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (required in production)

## Development
- Run `npm run dev` to start development server
- Run `npm run db:push` to sync database schema
- Frontend: http://localhost:5000
- Backend API: http://localhost:5000/api

## Known Integrations
- OpenAI AI Integrations (JavaScript) - for AI assistant
- Supabase (JavaScript) - database integration

## Completed Features
- ✅ Authentication and user management
- ✅ Circle creation and membership
- ✅ Real-time messaging with WebSocket
- ✅ AI assistant integration
- ✅ PWA with service worker and offline support
- ✅ In-app notifications with real-time updates
- ✅ Mobile chat enhancements (reactions, edit, delete, long-press)
- ✅ End-to-end tests for critical flows

## Future Enhancements
1. Push notifications with Firebase Cloud Messaging
2. Typing indicators for real-time chat
3. File/image sharing in messages
4. Voice/video calls within circles
5. Advanced moderation tools
