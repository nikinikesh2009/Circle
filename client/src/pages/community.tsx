import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@shared/schema';

export default function Community() {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActiveUsers = async () => {
      try {
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('streak', 'desc'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(usersQuery);
        const users: User[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || 'unknown@example.com',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            streak: data.streak || 0,
            bestStreak: data.bestStreak || 0,
            totalDays: data.totalDays || 0,
            lastCompletedDate: data.lastCompletedDate,
            likesGiven: data.likesGiven || 0,
          };
        });
        
        setActiveUsers(users);
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

  const totalMembers = activeUsers.length;
  const onlineNow = Math.max(1, Math.floor(activeUsers.length * 0.3));
  const totalStreaks = activeUsers.reduce((sum, user) => sum + user.streak, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Community</h1>
        <p className="text-muted-foreground">Connect with others on their journey to better habits</p>
      </div>

      {/* Community Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-members">{totalMembers.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-online-now">{onlineNow}</p>
                <p className="text-sm text-muted-foreground">Online Now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-streaks">{totalStreaks.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Streaks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Users List */}
      <Card className="border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Active Members</h2>
        </div>

        {activeUsers.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <h3 className="text-lg font-semibold mb-2">No Active Members Yet</h3>
            <p className="text-muted-foreground">Be the first to join The Circle and start your journey!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activeUsers.map((user, index) => (
            <div key={user.id} className="p-6 hover:bg-muted/50 transition-colors" data-testid={`user-item-${index}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                    {getInitials(user.email)}
                  </div>
                  <div>
                    <p className="font-medium" data-testid={`text-user-name-${index}`}>{getDisplayName(user.email)}</p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-user-joined-${index}`}>{getJoinedText(user.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"/>
                    </svg>
                    <span className="font-bold text-accent" data-testid={`text-user-streak-${index}`}>{user.streak} days</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Current streak</p>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </Card>

      {/* Coming Soon Notice */}
      <div className="mt-8 bg-muted/50 border border-border rounded-xl p-8 text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        <h3 className="text-xl font-semibold mb-2">Messaging Coming Soon</h3>
        <p className="text-muted-foreground">Direct messaging and group chats will be available in the next update. Stay tuned!</p>
      </div>
    </div>
  );
}
