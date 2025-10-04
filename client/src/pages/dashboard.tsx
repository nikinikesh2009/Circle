import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ref, get, set, update, remove, push, query as dbQuery, orderByChild, limitToFirst, runTransaction } from 'firebase/database';
import { db } from '@/lib/firebase';
import { MotivationalPost } from '@shared/schema';
import { Heart, Flame, TrendingUp, Award, Sparkles, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Dashboard() {
  const { userData, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [todaysPost, setTodaysPost] = useState<MotivationalPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  useEffect(() => {
    const loadTodaysPost = async () => {
      try {
        setLiked(false);
        
        const postsRef = ref(db, 'motivationalPosts');
        const snapshot = await get(postsRef);
        
        if (!snapshot.exists()) {
          toast({
            title: "No posts available",
            description: "Please run the seed script to add motivational posts.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const postsData = snapshot.val();
        const posts: MotivationalPost[] = Object.keys(postsData).map(key => ({
          id: key,
          content: postsData[key].content || '',
          imageUrl: postsData[key].imageUrl,
          category: postsData[key].category || 'Daily Wisdom',
          likes: postsData[key].likes || 0,
          createdAt: new Date(postsData[key].createdAt),
        }));

        const randomIndex = Math.floor(Math.random() * posts.length);
        const selectedPost = posts[randomIndex];
        setTodaysPost(selectedPost);

        if (userData) {
          const likeRef = ref(db, `postLikes/${userData.id}_${selectedPost.id}`);
          const likeSnapshot = await get(likeRef);
          setLiked(likeSnapshot.exists());
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

  const celebrateStreak = (streakCount: number) => {
    if (streakCount < 5 || streakCount % 5 !== 0) {
      return;
    }
    
    const colors = ['#7c3aed', '#14b8a6', '#8b5cf6', '#06b6d4'];
    
    if (streakCount % 10 === 0) {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: colors,
      });
    } else {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: colors,
      });
    }
  };

  const handleMarkAsDone = async () => {
    if (!userData) return;

    const today = new Date().toISOString().split('T')[0];

    setMarkingDone(true);
    try {
      const userRef = ref(db, `users/${userData.id}`);
      
      const result = await runTransaction(userRef, (currentUser) => {
        if (!currentUser) return currentUser;
        
        if (currentUser.lastCompletedDate === today) {
          return;
        }
        
        const newStreak = (currentUser.streak || 0) + 1;
        const newBestStreak = Math.max(newStreak, currentUser.bestStreak || 0);
        const newTotalDays = (currentUser.totalDays || 0) + 1;

        return {
          ...currentUser,
          streak: newStreak,
          bestStreak: newBestStreak,
          totalDays: newTotalDays,
          lastCompletedDate: today,
        };
      });

      if (!result.committed) {
        toast({
          title: "Already completed!",
          description: "You've already marked today's motivation as done.",
        });
        return;
      }

      const streakRef = ref(db, `userStreaks/${userData.id}-${today}`);
      await set(streakRef, {
        userId: userData.id,
        date: today,
        completed: true,
        createdAt: new Date().toISOString(),
      });

      await refreshUserData();

      const updatedStreak = userData.streak + 1;
      celebrateStreak(updatedStreak);
      
      toast({
        title: "Great job! 🎉",
        description: `Streak updated to ${updatedStreak} days! Keep it up!`,
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

    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 300);

    const likeDocId = `${userData.id}_${todaysPost.id}`;
    const likeRef = ref(db, `postLikes/${likeDocId}`);
    const oldLikes = todaysPost.likes;
    const oldLikedState = liked;

    try {
      const likeResult = await runTransaction(likeRef, (currentLike) => {
        if (currentLike) {
          return null;
        } else {
          return {
            userId: userData.id,
            postId: todaysPost.id,
            createdAt: new Date().toISOString(),
          };
        }
      });

      if (!likeResult.committed) {
        return;
      }

      const isLiking = likeResult.snapshot.val() !== null;

      if (isLiking) {
        setLiked(true);
        setTodaysPost({
          ...todaysPost,
          likes: oldLikes + 1
        });

        const postLikesRef = ref(db, `motivationalPosts/${todaysPost.id}/likes`);
        await runTransaction(postLikesRef, (currentLikes) => {
          return (currentLikes || 0) + 1;
        });

        const userLikesRef = ref(db, `users/${userData.id}/likesGiven`);
        await runTransaction(userLikesRef, (currentLikes) => {
          return (currentLikes || 0) + 1;
        });
      } else {
        setLiked(false);
        setTodaysPost({
          ...todaysPost,
          likes: oldLikes - 1
        });

        const postLikesRef = ref(db, `motivationalPosts/${todaysPost.id}/likes`);
        await runTransaction(postLikesRef, (currentLikes) => {
          return Math.max(0, (currentLikes || 0) - 1);
        });

        const userLikesRef = ref(db, `users/${userData.id}/likesGiven`);
        await runTransaction(userLikesRef, (currentLikes) => {
          return Math.max(0, (currentLikes || 0) - 1);
        });
      }

      await refreshUserData();
    } catch (error) {
      console.error('Error updating like:', error);
      setLiked(oldLikedState);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = userData.lastCompletedDate === today;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        
        {/* Welcome Header */}
        <div className="animate-fade-in-up mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Welcome back, <span data-testid="text-user-email">{userData.email.split('@')[0]}</span>
          </h1>
          <p className="text-lg text-muted-foreground">Keep the momentum going! You're doing great. ✨</p>
        </div>

        {/* Streak Display */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card className="group relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 shadow-2xl hover:shadow-primary/20 transition-all duration-300 rounded-3xl animate-pulse-glow">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 animate-pulse"></div>
            <CardContent className="relative p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left flex-1">
                  <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
                    <Flame className="w-5 h-5 text-accent" />
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Current Streak</p>
                  </div>
                  <div className="flex items-center gap-6 justify-center md:justify-start">
                    <span className="text-7xl md:text-8xl font-black text-accent streak-glow" data-testid="text-current-streak">
                      {userData.streak}
                    </span>
                    <div>
                      <p className="text-3xl font-bold text-foreground">Days</p>
                      <p className="text-sm text-muted-foreground mt-1">Keep burning! 🔥</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Flame className="w-28 h-28 text-accent group-hover:animate-flame-flicker drop-shadow-2xl" />
                  <p className="text-sm font-medium text-accent/90">You're on fire!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Motivation Post */}
        <div className="animate-fade-in-up space-y-6" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold">Today's Motivation</h2>
          </div>
          
          {todaysPost && (
            <Card className="group relative overflow-hidden border-border/50 shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 rounded-3xl">
              {/* Post Image */}
              <div className="relative h-72 md:h-96 bg-gradient-to-br from-primary/30 to-secondary/30 overflow-hidden">
                <img 
                  src={todaysPost.imageUrl}
                  alt="Daily motivation"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent"></div>
              </div>

              {/* Post Content */}
              <CardContent className="p-8 md:p-10">
                <div className="mb-6">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 text-primary text-sm font-semibold rounded-full border border-primary/30">
                    <Sparkles className="w-4 h-4" />
                    {todaysPost.category}
                  </span>
                </div>
                
                <blockquote className="text-2xl md:text-3xl font-semibold mb-8 leading-relaxed text-foreground" data-testid="text-motivation-content">
                  "{todaysPost.content}"
                </blockquote>

                <div className="flex items-center justify-between pt-6 border-t border-border/50">
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={handleLikePost}
                    className={`group/like flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:border-red-500/50 ${
                      liked ? 'bg-red-500/10 border-red-500/50' : ''
                    } ${likeAnimating ? 'animate-heart-beat' : ''}`}
                    data-testid="button-like-post"
                  >
                    <Heart 
                      className={`w-6 h-6 transition-all duration-300 ${
                        liked 
                          ? 'fill-red-500 text-red-500 scale-110' 
                          : 'text-muted-foreground group-hover/like:text-red-500'
                      }`}
                    />
                    <span className="text-base font-semibold" data-testid="text-likes-count">{todaysPost.likes}</span>
                  </Button>

                  <Button 
                    onClick={handleMarkAsDone}
                    disabled={markingDone || isCompletedToday}
                    size="lg"
                    className={`
                      relative overflow-hidden font-bold text-lg px-8 py-6
                      transition-all duration-300 hover:scale-105
                      ${isCompletedToday 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 cursor-not-allowed' 
                        : !markingDone 
                          ? 'bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-2xl hover:shadow-primary/50 animate-pulse-glow' 
                          : 'bg-gradient-to-r from-primary to-secondary opacity-80'
                      }
                    `}
                    data-testid="button-mark-done"
                  >
                    {markingDone ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Marking...
                      </>
                    ) : isCompletedToday ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Completed Today!
                      </>
                    ) : (
                      'Mark as Done'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Progress Stats */}
        <div className="animate-fade-in-up space-y-6" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-secondary" />
            <h2 className="text-3xl font-bold">Your Progress</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-primary/5 hover:from-primary/10 hover:to-card transition-all duration-500 hover:-translate-y-1 shadow-xl hover:shadow-2xl hover:shadow-primary/20 rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-4xl font-black text-foreground" data-testid="text-total-days">{userData.totalDays}</span>
                </div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Days Completed</p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-secondary/5 hover:from-secondary/10 hover:to-card transition-all duration-500 hover:-translate-y-1 shadow-xl hover:shadow-2xl hover:shadow-secondary/20 rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-8 h-8 text-secondary" />
                  </div>
                  <span className="text-4xl font-black text-foreground" data-testid="text-best-streak">{userData.bestStreak}</span>
                </div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Best Streak</p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-accent/5 hover:from-accent/10 hover:to-card transition-all duration-500 hover:-translate-y-1 shadow-xl hover:shadow-2xl hover:shadow-accent/20 rounded-2xl sm:col-span-2 lg:col-span-1">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-8 h-8 text-accent" />
                  </div>
                  <span className="text-4xl font-black text-foreground" data-testid="text-likes-given">{userData.likesGiven}</span>
                </div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Likes Given</p>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
