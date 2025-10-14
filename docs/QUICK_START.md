# Circle PWA - Quick Start Guide

## ⚡ 30-Second Setup

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Push database schema
npm run db:push

# 3. Start development server
npm run dev
```

**App runs at:** `http://localhost:5000`

---

## 🎯 Most Used Commands

### Development
```bash
npm run dev              # Start dev server (auto-reload)
npm run check            # Type-check TypeScript
```

### Database
```bash
npm run db:push          # Sync schema to database
npm run db:push -- --force   # Force sync (if conflicts)
npx drizzle-kit studio   # Open visual DB manager
```

### Quick Fixes
```bash
# Server won't start (port 5000 busy)
# → Restart "Start application" workflow in Replit UI
# → Click on workflow name → Click restart button

# Clear build cache
rm -rf dist node_modules/.vite

# Full reset (nuclear option)
rm -rf node_modules package-lock.json && npm install
```

---

## 📂 Key Files & Folders

| Path | Purpose |
|------|---------|
| `client/src/features/` | Feature modules (auth, circles, chat, etc.) |
| `server/routes.ts` | API endpoints |
| `server/storage.ts` | Database operations |
| `shared/schema.ts` | Database schema & types |
| `docs/API.md` | Full API documentation |
| `docs/DEVELOPMENT.md` | Detailed dev guide |

---

## 🔌 API Quick Reference

### Authentication
```bash
POST /api/auth/signup     # Create account
POST /api/auth/login      # Login
POST /api/auth/logout     # Logout
GET  /api/auth/me         # Get current user
```

### Circles
```bash
GET  /api/circles         # All circles
GET  /api/circles/official    # Official circles
GET  /api/circles/explore     # Discover circles
GET  /api/circles/my      # My circles
POST /api/circles         # Create circle
POST /api/circles/:id/join    # Join circle
```

### Messages
```bash
GET    /api/circles/:id/messages  # Get messages
PATCH  /api/messages/:id          # Edit message
DELETE /api/messages/:id          # Delete message
POST   /api/messages/:id/reactions    # Add reaction
```

### Direct Messages
```bash
POST /api/dm/conversations        # Create/get conversation
GET  /api/dm/conversations        # List conversations
POST /api/dm/conversations/:id/messages   # Send DM
GET  /api/dm/conversations/:id/messages   # Get DMs
```

**Full API docs:** [docs/API.md](./API.md)

---

## 🚀 Adding a New Feature (5 Steps)

### 1. Create Folder Structure
```bash
mkdir -p client/src/features/my-feature/{pages,components,hooks}
```

### 2. Add Database Schema
**File:** `shared/schema.ts`
```typescript
export const myTable = pgTable("my_table", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Export types
export type MyTable = typeof myTable.$inferSelect;
export const insertMyTableSchema = createInsertSchema(myTable);
export type InsertMyTable = z.infer<typeof insertMyTableSchema>;
```

### 3. Add Storage Method
**File:** `server/storage.ts`
```typescript
async getMyItems(userId: string) {
  return db.select()
    .from(myTable)
    .where(eq(myTable.userId, userId));
}
```

### 4. Add API Route
**File:** `server/routes.ts`
```typescript
app.get('/api/my-items', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  const items = await storage.getMyItems(req.user.id);
  res.json(items);
});
```

### 5. Create Frontend Page
**File:** `client/src/features/my-feature/pages/MyFeature.tsx`
```typescript
import { useQuery } from '@tanstack/react-query';

export default function MyFeature() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/my-items']
  });

  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {data?.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
}
```

**Then:** Add route in `client/src/App.tsx`

---

## 🐛 Debugging Checklist

### Server Issues
- [ ] Check logs: `tail -f /tmp/logs/Start_application_*.log`
- [ ] Verify DATABASE_URL: `echo $DATABASE_URL`
- [ ] Type-check: `npm run check`

### Frontend Issues
- [ ] Open browser DevTools (F12) → Console tab
- [ ] Check React Query DevTools (bottom of page)
- [ ] Clear cache: `rm -rf node_modules/.vite`

### Database Issues
- [ ] Open Drizzle Studio: `npx drizzle-kit studio`
- [ ] Sync schema: `npm run db:push`
- [ ] Force sync: `npm run db:push -- --force`

### WebSocket Issues
- [ ] Check server is on port 5000
- [ ] Verify WebSocket initialization in `server/index.ts`
- [ ] Test in browser: `new WebSocket('ws://localhost:5000')`

---

## 🔒 Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection (auto-configured in Replit)
- `SESSION_SECRET` - Session key (auto-configured in Replit)

**Optional:**
- `NODE_ENV` - "development" or "production"
- `PORT` - Server port (default: 5000)

---

## 📚 Learn More

- **[Full API Docs](./API.md)** - Complete endpoint reference
- **[Development Guide](./DEVELOPMENT.md)** - Detailed workflows & debugging
- **[Project Readme](../replit.md)** - Architecture & recent changes

---

## 💡 Pro Tips

1. **Use absolute imports**: `@/features/auth/...` instead of `../../../`
2. **TypeScript types**: Always import from `shared/schema.ts`
3. **React Query**: Use `queryKey: ['/api/endpoint', id]` for cache invalidation
4. **Database changes**: Edit `shared/schema.ts` → Run `npm run db:push`
5. **Test API**: Use Drizzle Studio or curl with session cookies

---

## 🆘 Getting Help

**Stuck?** Check these in order:
1. This quick start guide
2. [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed workflows
3. [API.md](./API.md) for endpoint documentation
4. [replit.md](../replit.md) for architecture overview
5. Server logs: `/tmp/logs/Start_application_*.log`
