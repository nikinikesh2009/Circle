import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ref, get, query, orderByChild, limitToFirst } from 'firebase/database';
import { db } from '@/lib/firebase';
import { User } from '@shared/schema';
import { Users, Trophy, Flame, TrendingUp, Crown, Medal, Award, User as UserIcon } from 'lucide-react';

export default function Community() {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActiveUsers = async () => {
      try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) {
          setActiveUsers([]);
          setLoading(false);
          return;
        }

        const usersData = snapshot.val();
        const users: User[] = Object.keys(usersData).map(key => {
          const data = usersData[key];
          return {
            id: key,
            email: data.email || 'unknown@example.com',
            createdAt: new Date(data.createdAt),
            streak: data.streak || 0,
            bestStreak: data.bestStreak || 0,
            totalDays: data.totalDays || 0,
            lastCompletedDate: data.lastCompletedDate,
            likesGiven: data.likesGiven || 0,
          };
        });

        users.sort((a, b) => b.streak - a.streak);
        setActiveUsers(users.slice(0, 10));
      } catch (error) {
        console.error('Error loading users:', error);
        setActiveUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadActiveUsers();
  }, []);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (email: string) => {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, ' ');
  };

  const getJoinedText = (createdAt: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `Joined ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Joined ${weeks} week${weeks === 1 ? '' : 's'} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `Joined ${months} month${months === 1 ? '' : 's'} ago`;
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return <Crown className="w-5 h-5 text-yellow-500" />;
    } else if (index === 1) {
      return <Medal className="w-5 h-5 text-gray-400" />;
    } else if (index === 2) {
      return <Award className="w-5 h-5 text-amber-600" />;
    }
    return null;
  };

  const getCardGradient = (index: number) => {
    if (index === 0) {
      return 'from-yellow-500/10 to-amber-500/5 border-yellow-500/30 hover:border-yellow-500/50';
    } else if (index === 1) {
      return 'from-gray-400/10 to-gray-500/5 border-gray-400/30 hover:border-gray-400/50';
    } else if (index === 2) {
      return 'from-amber-600/10 to-amber-700/5 border-amber-600/30 hover:border-amber-600/50';
    }
    return 'from-card to-primary/5 border-border/50 hover:border-primary/30';
  };

  const totalMembers = activeUsers.length;
  const onlineNow = Math.max(1, Math.floor(activeUsers.length * 0.3));
  const totalStreaks = activeUsers.reduce((sum, user) => sum + user.streak, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">Loading community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        
        {/* Page Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Community
          </h1>
          <p className="text-lg text-muted-foreground">Connect with others on their journey to better habits</p>
        </div>

        {/* Community Stats */}
        <div className="animate-fade-in-up grid md:grid-cols-3 gap-6" style={{ animationDelay: '0.1s' }}>
          <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-primary/5 hover:from-primary/10 hover:to-card transition-all duration-500 hover:-translate-y-1 shadow-xl hover:shadow-2xl hover:shadow-primary/20 rounded-3xl">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <span className="text-4xl font-black text-foreground" data-testid="text-total-members">{totalMembers.toLocaleString()}</span>
              </div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Members</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-secondary/5 hover:from-secondary/10 hover:to-card transition-all duration-500 hover:-translate-y-1 shadow-xl hover:shadow-2xl hover:shadow-secondary/20 rounded-3xl">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-secondary" />
                </div>
                <span className="text-4xl font-black text-foreground" data-testid="text-online-now">{onlineNow}</span>
              </div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Online Now</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-accent/5 hover:from-accent/10 hover:to-card transition-all duration-500 hover:-translate-y-1 shadow-xl hover:shadow-2xl hover:shadow-accent/20 rounded-3xl">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Flame className="w-8 h-8 text-accent" />
                </div>
                <span className="text-4xl font-black text-foreground" data-testid="text-total-streaks">{totalStreaks.toLocaleString()}</span>
              </div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Streaks</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Members Section */}
        <div className="animate-fade-in-up space-y-6" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold">Top Streakers</h2>
          </div>

          {activeUsers.length === 0 ? (
            <Card className="border-border/50 shadow-xl rounded-3xl overflow-hidden">
              <CardContent className="p-12 text-center">
                <Users className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-50" />
                <h3 className="text-2xl font-bold mb-3">No Active Members Yet</h3>
                <p className="text-muted-foreground text-lg">Be the first to join The Circle and start your journey!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeUsers.map((user, index) => (
                <Card 
                  key={user.id} 
                  className={`group relative overflow-hidden bg-gradient-to-br ${getCardGradient(index)} shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 rounded-3xl border-2`}
                  data-testid={`user-item-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {index < 3 ? (
                            <div className="text-xl font-bold text-primary-foreground">
                              {getInitials(user.email)}
                            </div>
                          ) : (
                            <UserIcon className="w-8 h-8 text-primary-foreground" />
                          )}
                        </div>
                        {getRankBadge(index) && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center border-2 border-background shadow-lg">
                            {getRankBadge(index)}
                          </div>
                        )}
                      </div>
                      {index === 0 && (
                        <span className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-600 dark:text-yellow-500 text-xs font-bold rounded-full border border-yellow-500/30">
                          #1
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-1" data-testid={`text-user-name-${index}`}>
                        {getDisplayName(user.email)}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid={`text-user-joined-${index}`}>
                        {getJoinedText(user.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-accent" />
                        <span className="text-2xl font-black text-accent" data-testid={`text-user-streak-${index}`}>
                          {user.streak}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Day Streak</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Coming Soon Notice */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Card className="border-border/50 bg-gradient-to-br from-card to-primary/5 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Messaging Coming Soon</h3>
              <p className="text-muted-foreground text-lg">Direct messaging and group chats will be available in the next update. Stay tuned!</p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
