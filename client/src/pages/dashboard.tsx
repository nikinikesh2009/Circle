import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, doc, updateDoc, Timestamp, setDoc, getDoc, deleteDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MotivationalPost } from '@shared/schema';

export default function Dashboard() {
  const { userData, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [todaysPost, setTodaysPost] = useState<MotivationalPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const loadTodaysPost = async () => {
      try {
        const postsQuery = query(collection(db, 'motivationalPosts'));
        const querySnapshot = await getDocs(postsQuery);
        
        if (querySnapshot.empty) {
          toast({
            title: "No posts available",
            description: "Please run the seed script to add motivational posts.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const posts: MotivationalPost[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            content: data.content || '',
            imageUrl: data.imageUrl,
            category: data.category || 'Daily Wisdom',
            likes: data.likes || 0,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          };
        });

        const randomIndex = Math.floor(Math.random() * posts.length);
        const selectedPost = posts[randomIndex];
        setTodaysPost(selectedPost);

        if (userData) {
          const likeDocRef = doc(db, 'postLikes', `${userData.id}_${selectedPost.id}`);
          const likeDoc = await getDoc(likeDocRef);
          setLiked(likeDoc.exists());
        }
      } catch (error) {
        console.error('Error loading post:', error);
        toast({
          title: "Error",
          description: "Failed to load today's motivation post.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTodaysPost();
  }, [userData]);

  const handleMarkAsDone = async () => {
    if (!userData) return;

    const today = new Date().toISOString().split('T')[0];
    
    if (userData.lastCompletedDate === today) {
      toast({
        title: "Already completed!",
        description: "You've already marked today's motivation as done.",
      });
      return;
    }

    setMarkingDone(true);
    try {
      const newStreak = userData.streak + 1;
      const newBestStreak = Math.max(newStreak, userData.bestStreak);
      const newTotalDays = userData.totalDays + 1;

      // Update user document in Firestore
      await updateDoc(doc(db, 'users', userData.id), {
        streak: newStreak,
        bestStreak: newBestStreak,
        totalDays: newTotalDays,
        lastCompletedDate: today,
      });

      // Add streak record
      await setDoc(doc(db, 'userStreaks', `${userData.id}-${today}`), {
        userId: userData.id,
        date: today,
        completed: true,
        createdAt: Timestamp.now(),
      });

      await refreshUserData();

      toast({
        title: "Great job! 🎉",
        description: `Streak updated to ${newStreak} days! Keep it up!`,
      });
    } catch (error) {
      console.error('Error updating streak:', error);
      toast({
        title: "Error",
        description: "Failed to update your streak. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMarkingDone(false);
    }
  };

  const handleLikePost = async () => {
    if (!todaysPost || !userData) return;

    const newLikedState = !liked;
    const likeDocId = `${userData.id}_${todaysPost.id}`;
    const oldLikes = todaysPost.likes;

    setLiked(newLikedState);
    setTodaysPost({
      ...todaysPost,
      likes: newLikedState ? oldLikes + 1 : oldLikes - 1
    });

    try {
      if (newLikedState) {
        await setDoc(doc(db, 'postLikes', likeDocId), {
          userId: userData.id,
          postId: todaysPost.id,
          createdAt: Timestamp.now(),
        });

        await updateDoc(doc(db, 'motivationalPosts', todaysPost.id), {
          likes: increment(1),
        });

        await updateDoc(doc(db, 'users', userData.id), {
          likesGiven: increment(1),
        });
      } else {
        await deleteDoc(doc(db, 'postLikes', likeDocId));

        await updateDoc(doc(db, 'motivationalPosts', todaysPost.id), {
          likes: increment(-1),
        });

        await updateDoc(doc(db, 'users', userData.id), {
          likesGiven: increment(-1),
        });
      }

      await refreshUserData();
    } catch (error) {
      console.error('Error updating like:', error);
      setLiked(!newLikedState);
      setTodaysPost({
        ...todaysPost,
        likes: oldLikes
      });
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userData) return null;

  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = userData.lastCompletedDate === today;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Welcome back, <span className="text-primary" data-testid="text-user-email">{userData.email}</span>
        </h1>
        <p className="text-muted-foreground">Keep the momentum going! You're doing great.</p>
      </div>

      {/* Streak Display */}
      <div className="mb-8">
        <Card className="border-border bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Current Streak</p>
                <div className="flex items-center gap-4">
                  <span className="text-6xl md:text-7xl font-bold text-accent streak-glow" data-testid="text-current-streak">
                    {userData.streak}
                  </span>
                  <div>
                    <p className="text-2xl font-semibold">Days</p>
                    <p className="text-sm text-muted-foreground">Keep it up!</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <svg className="w-24 h-24 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"/>
                </svg>
                <p className="text-xs text-muted-foreground text-center">🔥 You're on fire!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Motivation Post */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Today's Motivation</h2>
        
        {todaysPost && (
          <Card className="border-border overflow-hidden">
            {/* Post Image */}
            <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary/20 to-secondary/20">
              <img 
                src={todaysPost.imageUrl}
                alt="Daily motivation"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent"></div>
            </div>

            {/* Post Content */}
            <CardContent className="p-6 md:p-8">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                  {todaysPost.category}
                </span>
              </div>
              
              <blockquote className="text-xl md:text-2xl font-medium mb-6 leading-relaxed" data-testid="text-motivation-content">
                "{todaysPost.content}"
              </blockquote>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={handleLikePost}
                    className="flex items-center gap-2"
                    data-testid="button-like-post"
                  >
                    <svg 
                      className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-current'}`} 
                      fill={liked ? 'currentColor' : 'none'} 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                    <span className="text-sm font-medium" data-testid="text-likes-count">{todaysPost.likes}</span>
                  </Button>
                </div>

                <Button 
                  onClick={handleMarkAsDone}
                  disabled={markingDone || isCompletedToday}
                  className="bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold hover:opacity-90"
                  data-testid="button-mark-done"
                >
                  {markingDone ? 'Marking...' : isCompletedToday ? 'Completed Today!' : 'Mark as Done'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span className="text-2xl font-bold" data-testid="text-total-days">{userData.totalDays}</span>
              </div>
              <p className="text-sm text-muted-foreground">Days Completed</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                  </svg>
                </div>
                <span className="text-2xl font-bold" data-testid="text-best-streak">{userData.bestStreak}</span>
              </div>
              <p className="text-sm text-muted-foreground">Best Streak</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                </div>
                <span className="text-2xl font-bold" data-testid="text-likes-given">{userData.likesGiven}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Likes Given</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
