import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ref, get, set, update, remove, push, query as dbQuery, orderByChild, limitToFirst, runTransaction } from 'firebase/database';
import { db } from '@/lib/firebase';
import { MotivationalPost } from '@shared/schema';
import { Heart, Flame, TrendingUp, Award, Sparkles, CheckCircle, Bot, Calendar, Target, Brain, Zap, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';

export default function Dashboard() {
  const { userData, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [todaysPost, setTodaysPost] = useState<MotivationalPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [generatingInsight, setGeneratingInsight] = useState(false);

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

  useEffect(() => {
    const generateDailyInsight = async () => {
      if (!userData) return;
      
      setGeneratingInsight(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        const response = await apiRequest<{ message: string }>("POST", "/api/ai/generate-popup", {
          type: "motivation",
          context: `User has ${userData.streak} day streak, ${userData.totalDays} total days completed. Current time: ${currentTime}. Generate a brief, personalized daily insight and encouragement.`
        });
        
        setAiInsight(response.message);
      } catch (error) {
        console.error('Error generating AI insight:', error);
        setAiInsight("Keep pushing forward! Your AI manager is here to help you succeed.");
      } finally {
        setGeneratingInsight(false);
      }
    };

    generateDailyInsight();
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
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-6">
        
        {/* Welcome Header */}
        <div className="animate-fade-in-up mb-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-1.5 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Welcome back, <span data-testid="text-user-email">{userData.email.split('@')[0]}</span>
          </h1>
          <p className="text-sm text-muted-foreground">Keep the momentum going! You're doing great. ✨</p>
        </div>

        {/* AI Manager Control Panel */}
        <div className="animate-fade-in-up space-y-3" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary animate-pulse" />
            <h2 className="text-xl font-bold">AI Manager</h2>
            <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full border border-primary/30 font-semibold">Active</span>
          </div>
          
          <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-secondary/5 shadow-lg rounded-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
            <CardContent className="p-4">
              {/* AI Daily Insight */}
              <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                  <h3 className="text-sm font-semibold text-foreground">Daily AI Insight</h3>
                </div>
                {generatingInsight ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating personalized insight...</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-ai-insight">{aiInsight}</p>
                )}
              </div>

              {/* Quick AI Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Link href="/chat">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-auto flex flex-col items-center gap-1.5 py-3 hover:bg-primary/10 hover:border-primary/50"
                    data-testid="button-ai-chat"
                  >
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium">AI Chat</span>
                  </Button>
                </Link>
                
                <Link href="/chat">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-auto flex flex-col items-center gap-1.5 py-3 hover:bg-secondary/10 hover:border-secondary/50"
                    data-testid="button-daily-planner"
                  >
                    <Calendar className="w-5 h-5 text-secondary" />
                    <span className="text-xs font-medium">Daily Plan</span>
                  </Button>
                </Link>
                
                <Link href="/chat">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-auto flex flex-col items-center gap-1.5 py-3 hover:bg-accent/10 hover:border-accent/50"
                    data-testid="button-goal-tracker"
                  >
                    <Target className="w-5 h-5 text-accent" />
                    <span className="text-xs font-medium">Goals</span>
                  </Button>
                </Link>
                
                <Link href="/chat">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-auto flex flex-col items-center gap-1.5 py-3 hover:bg-primary/10 hover:border-primary/50"
                    data-testid="button-ai-solver"
                  >
                    <Brain className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium">Solve</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Streak Display */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card className="group relative overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 shadow-lg hover:shadow-primary/20 transition-all duration-300 rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 animate-pulse"></div>
            <CardContent className="relative p-4 md:p-5">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left flex-1">
                  <div className="flex items-center gap-1.5 mb-2 justify-center md:justify-start">
                    <Flame className="w-4 h-4 text-accent" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Current Streak</p>
                  </div>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <span className="text-4xl md:text-5xl font-black text-accent" data-testid="text-current-streak">
                      {userData.streak}
                    </span>
                    <div>
                      <p className="text-xl font-bold text-foreground">Days</p>
                      <p className="text-xs text-muted-foreground">Keep burning! 🔥</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Flame className="w-16 h-16 text-accent group-hover:animate-flame-flicker" />
                  <p className="text-xs font-medium text-accent/90">You're on fire!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Motivation Post */}
        <div className="animate-fade-in-up space-y-3" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Today's Motivation</h2>
          </div>
          
          {todaysPost && (
            <Card className="group relative overflow-hidden border-border/50 shadow-lg hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-0.5 rounded-2xl">
              {/* Post Image */}
              <div className="relative h-48 md:h-60 bg-gradient-to-br from-primary/30 to-secondary/30 overflow-hidden">
                <img 
                  src={todaysPost.imageUrl}
                  alt="Daily motivation"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent"></div>
              </div>

              {/* Post Content */}
              <CardContent className="p-4 md:p-5">
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-primary/20 to-secondary/20 text-primary text-xs font-semibold rounded-full border border-primary/30">
                    <Sparkles className="w-3 h-3" />
                    {todaysPost.category}
                  </span>
                </div>
                
                <blockquote className="text-base md:text-lg font-semibold mb-4 leading-relaxed text-foreground" data-testid="text-motivation-content">
                  "{todaysPost.content}"
                </blockquote>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleLikePost}
                    className={`group/like flex items-center gap-2 transition-all duration-300 hover:border-red-500/50 ${
                      liked ? 'bg-red-500/10 border-red-500/50' : ''
                    } ${likeAnimating ? 'animate-heart-beat' : ''}`}
                    data-testid="button-like-post"
                  >
                    <Heart 
                      className={`w-4 h-4 transition-all duration-300 ${
                        liked 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-muted-foreground group-hover/like:text-red-500'
                      }`}
                    />
                    <span className="text-sm font-semibold" data-testid="text-likes-count">{todaysPost.likes}</span>
                  </Button>

                  <Button 
                    onClick={handleMarkAsDone}
                    disabled={markingDone || isCompletedToday}
                    size="sm"
                    className={`
                      relative overflow-hidden font-semibold text-sm px-4 py-2
                      transition-all duration-300
                      ${isCompletedToday 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 cursor-not-allowed' 
                        : !markingDone 
                          ? 'bg-gradient-to-r from-primary via-secondary to-accent' 
                          : 'bg-gradient-to-r from-primary to-secondary opacity-80'
                      }
                    `}
                    data-testid="button-mark-done"
                  >
                    {markingDone ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
                        Marking...
                      </>
                    ) : isCompletedToday ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Completed!
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
        <div className="animate-fade-in-up space-y-3" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-bold">Your Progress</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-primary/5 hover:from-primary/10 hover:to-card transition-all duration-500 hover:-translate-y-0.5 shadow-md hover:shadow-lg rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-2xl font-black text-foreground" data-testid="text-total-days">{userData.totalDays}</span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Days Completed</p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-secondary/5 hover:from-secondary/10 hover:to-card transition-all duration-500 hover:-translate-y-0.5 shadow-md hover:shadow-lg rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-2xl font-black text-foreground" data-testid="text-best-streak">{userData.bestStreak}</span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Best Streak</p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-accent/5 hover:from-accent/10 hover:to-card transition-all duration-500 hover:-translate-y-0.5 shadow-md hover:shadow-lg rounded-xl sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-2xl font-black text-foreground" data-testid="text-likes-given">{userData.likesGiven}</span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Likes Given</p>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
