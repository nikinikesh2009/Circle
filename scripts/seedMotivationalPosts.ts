import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp, getDocs, query } from "firebase/firestore";

if (!process.env.VITE_FIREBASE_API_KEY || !process.env.VITE_FIREBASE_PROJECT_ID || !process.env.VITE_FIREBASE_APP_ID) {
  console.error('❌ Missing Firebase environment variables. Please set:');
  console.error('   VITE_FIREBASE_API_KEY');
  console.error('   VITE_FIREBASE_PROJECT_ID');
  console.error('   VITE_FIREBASE_APP_ID');
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const motivationalPosts = [
  {
    content: "The journey of a thousand miles begins with a single step. Every day you show up is a victory worth celebrating.",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    category: "Daily Wisdom"
  },
  {
    content: "Success is not final, failure is not fatal: it is the courage to continue that counts. Keep moving forward.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    category: "Motivation"
  },
  {
    content: "The only impossible journey is the one you never begin. Start where you are, use what you have, do what you can.",
    imageUrl: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    category: "Inspiration"
  },
  {
    content: "Believe you can and you're halfway there. Your mindset shapes your reality more than you know.",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    category: "Mindset"
  },
  {
    content: "Don't watch the clock; do what it does. Keep going. Consistency is the key to achieving your dreams.",
    imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    category: "Perseverance"
  },
  {
    content: "You are never too old to set another goal or to dream a new dream. Every moment is a new beginning.",
    imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    category: "Growth"
  },
  {
    content: "The best time to plant a tree was 20 years ago. The second best time is now. Start today.",
    imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    category: "Action"
  },
  {
    content: "Your limitation—it's only your imagination. Break free from self-imposed boundaries.",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    category: "Potential"
  },
  {
    content: "Great things never come from comfort zones. Embrace the discomfort and grow stronger.",
    imageUrl: "https://images.unsplash.com/photo-1434394354979-a235cd36269d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    category: "Challenge"
  },
  {
    content: "Dream it. Wish it. Do it. Transform your aspirations into actions, one step at a time.",
    imageUrl: "https://images.unsplash.com/photo-1418985991508-e47386d96a71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    category: "Dreams"
  }
];

async function seedPosts() {
  console.log('Starting to seed motivational posts...');
  console.log('Checking for existing posts...\n');
  
  try {
    const existingPosts = await getDocs(query(collection(db, 'motivationalPosts')));
    
    if (!existingPosts.empty) {
      console.log(`⚠️  Found ${existingPosts.size} existing posts in the database.`);
      console.log('Skipping seed to avoid duplicates.');
      console.log('If you want to re-seed, please delete the existing posts from Firebase Console first.\n');
      process.exit(0);
    }

    for (const post of motivationalPosts) {
      const docRef = await addDoc(collection(db, 'motivationalPosts'), {
        ...post,
        likes: 0,
        createdAt: Timestamp.now(),
      });
      console.log(`✓ Added post: ${post.content.substring(0, 50)}... (ID: ${docRef.id})`);
    }
    
    console.log('\n✅ Successfully seeded all motivational posts!');
    console.log(`Total posts added: ${motivationalPosts.length}`);
  } catch (error: any) {
    console.error('\n❌ Error seeding posts:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Firestore is enabled in your Firebase Console');
    console.error('2. Check that your Firebase credentials are correct');
    console.error('3. Verify Firestore security rules allow writes in test mode');
    process.exit(1);
  }
  
  process.exit(0);
}

seedPosts();
