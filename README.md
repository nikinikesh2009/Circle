# The Circle

Daily motivation, habit tracking, and community connection.

## Features

- **Firebase Authentication**: Secure email/password registration and login
- **Daily Motivation**: Random motivational posts displayed each day
- **Streak Tracking**: Track your daily progress and build momentum
- **Community**: See active members and their streaks
- **Profile Management**: View your stats and update your password
- **Like System**: Interact with motivational posts
- **Dark Mode**: Beautiful dark theme by default

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Click "Add app" and select the Web platform (</>)

#### Enable Authentication
1. Navigate to **Authentication** in the left sidebar
2. Click **Get Started**
3. Enable **Email/Password** sign-in method
4. Under **Settings** > **Authorized domains**, add your Replit dev URL

#### Enable Realtime Database
1. Navigate to **Realtime Database** in the left sidebar
2. Click **Create Database**
3. Choose a location close to you
4. **IMPORTANT:** Choose **Start in test mode** (for development - allows read/write access)
5. Click **Enable**

**Verify Test Mode Rules:**
After creating the database, go to the **Rules** tab and ensure your rules look like this:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
These permissive rules are for development only. Update them for production (see Security Notes section).

#### Get Your Firebase Credentials
1. Go to **Project settings** (gear icon) > **General**
2. Scroll to "Your apps" and find your web app
3. Copy these values and add them to Replit Secrets:
   - `VITE_FIREBASE_API_KEY` - Your Firebase API key
   - `VITE_FIREBASE_APP_ID` - Your Firebase App ID
   - `VITE_FIREBASE_PROJECT_ID` - Your Firebase Project ID

### 2. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 3. Seed Motivational Posts

After enabling Realtime Database, run the seed script to add initial motivational posts:

```bash
npx tsx scripts/seedMotivationalPosts.ts
```

This will add 10 motivational posts to your Realtime Database. The script will skip if posts already exist to avoid duplicates.

### 4. Run the Application

```bash
npm run dev
```

The application will start on port 5000.

## Usage

### For Users

1. **Register**: Create an account on the registration page
2. **Dashboard**: View your daily motivational post and current streak
3. **Mark as Done**: Click the button to increment your streak for the day
4. **Like Posts**: Show appreciation for motivational content
5. **Community**: See other active members and their progress
6. **Profile**: View your stats and update your password

### For Administrators

To add more motivational posts, you can either:
- Use the Firebase Console to manually add data to the `motivationalPosts` node
- Modify `scripts/seedMotivationalPosts.ts` and re-run the seed script

Each post should have this structure:
```javascript
{
  content: "Your motivational message here",
  imageUrl: "https://...", // Optional image URL
  category: "Daily Wisdom", // Category name
  likes: 0, // Initial like count
  createdAt: new Date().toISOString()
}
```

## Database Schema

### Realtime Database Structure

**users/{userId}**
```json
{
  "email": "user@example.com",
  "streak": 5,
  "bestStreak": 10,
  "totalDays": 25,
  "lastCompletedDate": "2025-10-04",
  "likesGiven": 15,
  "createdAt": "2025-09-01T12:00:00.000Z"
}
```

**motivationalPosts/{postId}**
```json
{
  "content": "The journey of a thousand miles begins with a single step.",
  "imageUrl": "https://example.com/image.jpg",
  "category": "Daily Wisdom",
  "likes": 42,
  "createdAt": "2025-10-01T08:00:00.000Z"
}
```

**postLikes/{userId}_{postId}**
```json
{
  "userId": "user123",
  "postId": "post456",
  "createdAt": "2025-10-04T10:30:00.000Z"
}
```

**userStreaks/{userId}-{date}**
```json
{
  "userId": "user123",
  "date": "2025-10-04",
  "completed": true,
  "createdAt": "2025-10-04T10:30:00.000Z"
}
```

## Tech Stack

- **Frontend**: React, Wouter (routing), Tailwind CSS
- **Backend**: Firebase Authentication, Firebase Realtime Database
- **UI Components**: shadcn/ui
- **Build Tool**: Vite

## Environment Variables

Required environment variables (add to Replit Secrets):

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_APP_ID` - Firebase App ID
- `VITE_FIREBASE_PROJECT_ID` - Firebase Project ID
- `SESSION_SECRET` - Session secret (auto-generated)

## Development

The application uses Firebase's browser SDK for all operations. No separate backend server is required for data persistence.

### Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts (Auth)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and Firebase config
│   │   └── pages/        # Page components
├── scripts/              # Utility scripts
│   └── seedMotivationalPosts.ts
├── shared/               # Shared types and schemas
└── server/               # Express server for serving frontend
```

## Security Notes

**For Production:**
1. Update Realtime Database security rules from test mode to production rules
2. Implement proper rate limiting for authentication
3. Add email verification for new accounts
4. Consider adding password reset functionality
5. Review and update Firebase security rules based on your needs

Example production Realtime Database rules:
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid"
      }
    },
    "motivationalPosts": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "userLikes": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## Troubleshooting

### Realtime Database Connection Errors

**"Permission denied" errors:**
This is the most common error and means your Firebase Realtime Database isn't properly configured.

**Solution:**
1. Go to Firebase Console → Realtime Database
2. Click on the **Rules** tab
3. Ensure rules are set to test mode:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
4. Click **Publish** to save the rules
5. Refresh your app and try again

**Other connection issues:**
- Ensure Realtime Database is enabled in Firebase Console (not just Firestore)
- Verify all environment variables are correctly set in Replit Secrets
- Confirm the `databaseURL` in firebase config matches your project

### No Motivational Posts Showing
- Run the seed script: `npx tsx scripts/seedMotivationalPosts.ts`
- Check Realtime Database Console to verify posts exist under `motivationalPosts` node
- Ensure your security rules allow read access

### Authentication Issues
- Ensure Email/Password authentication is enabled
- Add your Replit dev URL to authorized domains in Firebase
- Check browser console for specific auth errors

## License

This project is provided as-is for educational and personal use.
