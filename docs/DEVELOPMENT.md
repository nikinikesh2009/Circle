# Circle PWA - Development Guide

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Database Management](#database-management)
- [Development Workflow](#development-workflow)
- [Debugging](#debugging)
- [Testing](#testing)
- [Deployment](#deployment)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ 
- PostgreSQL database (provided by Replit)
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
# DATABASE_URL and SESSION_SECRET are automatically configured in Replit
```

### First Run
```bash
# Push database schema
npm run db:push

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`

---

## 📜 Available Scripts

### Development
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run check` | Type-check TypeScript files |

### Database Scripts
| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema changes to database |
| `npm run db:push -- --force` | Force push schema (use with caution) |

### Useful Custom Scripts

Create these in your terminal for better workflow:

#### Kill Port 5000
```bash
# If port 5000 is stuck, restart the workflow in Replit UI
# Click on "Start application" workflow → Click restart button

# Or use pkill (if available)
pkill -f "tsx server/index.ts"
```

#### Database Studio (Visual Interface)
```bash
npx drizzle-kit studio
```

#### View Server Logs
```bash
tail -f /tmp/logs/Start_application_*.log
```

#### View Browser Logs
```bash
tail -f /tmp/logs/browser_console_*.log
```

#### Type Check Only
```bash
npx tsc --noEmit
```

#### Clean Build Cache
```bash
rm -rf dist node_modules/.vite
```

#### Full Clean (Nuclear Option)
```bash
rm -rf dist node_modules/.vite node_modules package-lock.json
npm install
```

---

## 🗄️ Database Management

### Schema Changes
1. Edit `shared/schema.ts`
2. Run `npm run db:push` to sync changes
3. If conflicts occur, use `npm run db:push -- --force`

**Important:** Never change existing ID column types (serial ↔ varchar)

### Database Studio
Visual database management:
```bash
npx drizzle-kit studio
```
Access at: `https://local.drizzle.studio`

### Database Reset
```bash
# Drop all tables (destructive!)
npx drizzle-kit drop

# Push fresh schema
npm run db:push
```

### Seed Data
No automatic seeding script yet. Create one:
```bash
# Create seed script
touch server/seed.ts
```

Example seed script:
```typescript
import { db } from './db';
import { users, circles } from '../shared/schema';

async function seed() {
  // Insert test users
  await db.insert(users).values([
    {
      email: 'test@circle.com',
      password: 'hashedpassword',
      name: 'Test User',
      username: 'testuser'
    }
  ]);

  // Insert official circles
  await db.insert(circles).values([
    {
      name: 'AI & Tech',
      description: 'Discuss AI and technology',
      isOfficial: true
    }
  ]);
}

seed();
```

---

## 🔧 Development Workflow

### Project Structure
```
circle-pwa/
├── client/src/          # Frontend React app
│   ├── features/        # Feature modules (auth, circles, chat, etc.)
│   ├── layout/          # Layout components
│   ├── services/        # Global services
│   ├── styles/          # Global styles
│   └── components/ui/   # Shadcn UI components
├── server/              # Backend Express app
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   └── index.ts         # Server entry point
├── shared/              # Shared TypeScript types
│   └── schema.ts        # Database schema
└── docs/                # Documentation
```

### Adding a New Feature

1. **Create Feature Folder**
```bash
mkdir -p client/src/features/my-feature/{pages,components,hooks}
```

2. **Add Database Schema** (`shared/schema.ts`)
```typescript
export const myFeature = pgTable("my_feature", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
```

3. **Add Storage Methods** (`server/storage.ts`)
```typescript
async getMyFeatureItems() {
  return db.select().from(myFeature);
}
```

4. **Add API Routes** (`server/routes.ts`)
```typescript
app.get('/api/my-feature', async (req, res) => {
  const items = await storage.getMyFeatureItems();
  res.json(items);
});
```

5. **Create Frontend Component**
```typescript
// client/src/features/my-feature/pages/MyFeature.tsx
export default function MyFeature() {
  const { data } = useQuery({
    queryKey: ['/api/my-feature']
  });
  
  return <div>{/* Your UI */}</div>;
}
```

6. **Add Route** (`client/src/App.tsx`)
```typescript
<Route path="/my-feature" component={MyFeature} />
```

---

## 🐛 Debugging

### Backend Debugging
```bash
# View server logs in real-time
tail -f /tmp/logs/Start_application_*.log

# Or use console.log in server code
console.log('Debug:', variable);
```

### Frontend Debugging
```bash
# View browser console logs
tail -f /tmp/logs/browser_console_*.log

# Or use browser DevTools
# Right-click → Inspect → Console tab
```

### Database Debugging
```bash
# Open Drizzle Studio
npx drizzle-kit studio

# Or use SQL tool
npx tsx -e "
import { db } from './server/db';
import { users } from './shared/schema';

const result = await db.select().from(users);
console.log(result);
"
```

### WebSocket Debugging
```javascript
// In browser console
const ws = new WebSocket('ws://localhost:5000');
ws.onmessage = (e) => console.log('WS:', e.data);
ws.send(JSON.stringify({ type: 'join_circle', circleId: '1' }));
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Authentication (signup, login, logout)
- [ ] Circle creation and joining
- [ ] Real-time messaging
- [ ] Direct messages
- [ ] Notifications
- [ ] Profile updates
- [ ] AI assistant

### Test Accounts
Create test accounts for different scenarios:
```sql
-- Admin user
INSERT INTO users (email, password, name, username, status)
VALUES ('admin@circle.com', '$2a$10$...', 'Admin User', 'admin', 'online');

-- Regular user
INSERT INTO users (email, password, name, username, status)
VALUES ('user@circle.com', '$2a$10$...', 'Test User', 'testuser', 'online');
```

### API Testing with curl
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@circle.com","password":"password123"}' \
  -c cookies.txt

# Get user info (with session)
curl http://localhost:5000/api/auth/me -b cookies.txt

# Get circles
curl http://localhost:5000/api/circles -b cookies.txt
```

---

## 🚢 Deployment

### Build for Production
```bash
# Build frontend and backend
npm run build

# Test production build locally
npm start
```

### Environment Variables (Production)
Required secrets:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (random string)

Optional:
- `NODE_ENV=production`
- `PORT=5000`

### Deploy to Replit
1. Click "Publish" button in Replit
2. Configure custom domain (optional)
3. Enable always-on (optional)

### Health Checks
```bash
# Check if server is running
curl http://localhost:5000/api/auth/me

# Expected: 401 if not logged in (server working)
```

---

## 🔥 Common Issues & Solutions

### Port 5000 Already in Use
```bash
# Restart the workflow in Replit UI
# Click on "Start application" workflow → Click restart button

# Or try pkill (if available)
pkill -f "tsx server/index.ts"
npm run dev
```

### Database Connection Failed
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Test connection
npx tsx -e "
import { db } from './server/db';
const result = await db.execute('SELECT 1');
console.log('Connected:', result);
"
```

### TypeScript Errors
```bash
# Clear cache
rm -rf node_modules/.vite

# Check types
npx tsc --noEmit
```

### WebSocket Connection Failed
- Check server is running on port 5000
- Verify WebSocket server is initialized in `server/index.ts`
- Check browser console for connection errors

### Build Fails
```bash
# Clean everything
rm -rf dist node_modules/.vite
npm install
npm run build
```

---

## 📚 Additional Resources

- [API Documentation](./API.md)
- [Replit Documentation](https://docs.replit.com)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [React Query Docs](https://tanstack.com/query)
- [Shadcn UI Components](https://ui.shadcn.com)

---

## 🤝 Contributing

### Code Style
- Use TypeScript for all new code
- Follow existing folder structure
- Use absolute imports (`@/features/...`)
- Add proper types from `shared/schema.ts`

### Git Workflow
```bash
# Feature branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "feat: add my feature"

# Push
git push origin feature/my-feature
```

### Pull Request Checklist
- [ ] TypeScript type-checks pass
- [ ] All features tested manually
- [ ] API documentation updated
- [ ] Database schema updated if needed
- [ ] No console errors in browser
