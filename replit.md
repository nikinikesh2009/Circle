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

### Latest Updates (October 13, 2025)
- ✅ **Mobile Chat Enhancements** (Production-Ready):
  - Message reactions system with emoji support (👍❤️😂😮🎉🔥)
  - Long-press context menu for edit/delete on mobile
  - Message editing with real-time sync across clients
  - Soft deletion with "Message deleted" placeholder
  - Reactions stored with composite PK (message_id, user_id, emoji)
  - All features tested end-to-end and verified working
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
- **Theme**: Dark mode by default with light mode toggle
- **Pages**:
  - `/login`, `/signup` - Authentication
  - `/` - Home/Circles dashboard
  - `/chat` - Real-time messaging
  - `/ai` - AI Assistant
  - `/profile` - User profile
  - `/support` - Help & FAQ

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

### Database Schema
- **users**: id, email, password (hashed), name, username, avatar, bio, status, created_at
- **circles**: id, name, description, cover_image, category, is_private, created_by, member_count, created_at
- **circle_members**: circle_id, user_id, role, joined_at (composite PK)
- **messages**: id, circle_id, user_id, content, is_edited, is_deleted, created_at
- **reactions**: message_id, user_id, emoji, created_at (composite PK on message_id, user_id, emoji)
- **notifications**: id, user_id, type, title, message, link, read, created_at

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
