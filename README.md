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

#### Enable Firestore Database
1. Navigate to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location close to you
5. Click **Enable**

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

After enabling Firestore, run the seed script to add initial motivational posts:

```bash
npx tsx scripts/seedMotivationalPosts.ts
```

This will add 10 motivational posts to your Firestore database. The script will skip if posts already exist to avoid duplicates.

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
- Use the Firebase Console to manually add documents to the `motivationalPosts` collection
- Modify `scripts/seedMotivationalPosts.ts` and re-run the seed script

Each post should have this structure:
```javascript
{
  content: "Your motivational message here",
  imageUrl: "https://...", // Optional image URL
  category: "Daily Wisdom", // Category name
  likes: 0, // Initial like count
  createdAt: Timestamp.now()
}
```

## Database Schema

### Collections

**users**
- `id`: User ID (from Firebase Auth)
- `email`: User email
- `streak`: Current consecutive days streak
- `bestStreak`: Highest streak ever achieved
- `totalDays`: Total days completed
- `lastCompletedDate`: Last date marked as done (YYYY-MM-DD)
- `likesGiven`: Total likes given by user
- `createdAt`: Account creation timestamp

**motivationalPosts**
- `id`: Auto-generated
- `content`: The motivational message
- `imageUrl`: Optional background image URL
- `category`: Post category (e.g., "Daily Wisdom", "Motivation")
- `likes`: Total number of likes
- `createdAt`: Post creation timestamp

**postLikes**
- `id`: Format `${userId}_${postId}`
- `userId`: ID of user who liked
- `postId`: ID of post that was liked
- `createdAt`: When the like occurred

**userStreaks**
- `id`: Auto-generated
- `userId`: User ID
- `date`: Date in YYYY-MM-DD format
- `completed`: Boolean indicating completion
- `createdAt`: Record creation timestamp

## Tech Stack

- **Frontend**: React, Wouter (routing), Tailwind CSS
- **Backend**: Firebase Authentication, Firestore Database
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
1. Update Firestore security rules from test mode to production rules
2. Implement proper rate limiting for authentication
3. Add email verification for new accounts
4. Consider adding password reset functionality
5. Review and update Firebase security rules based on your needs

## Troubleshooting

### Firestore Connection Errors
- Ensure Firestore is enabled in Firebase Console
- Check that security rules are set to test mode
- Verify all environment variables are correctly set

### No Motivational Posts Showing
- Run the seed script: `npm run seed`
- Check Firestore Console to verify posts exist

### Authentication Issues
- Ensure Email/Password authentication is enabled
- Add your Replit dev URL to authorized domains in Firebase

## License

This project is provided as-is for educational and personal use.
