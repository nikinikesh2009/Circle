import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Lock } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { type Badge as BadgeType, type UserBadge } from '@shared/schema';

const rarityColors = {
  common: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  rare: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  epic: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  legendary: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

const rarityGradients = {
  common: 'from-gray-500/20 to-gray-600/20',
  rare: 'from-blue-500/20 to-blue-600/20',
  epic: 'from-purple-500/20 to-purple-600/20',
  legendary: 'from-yellow-500/20 to-yellow-600/20',
};

export default function BadgeShowcase() {
  const { currentUser } = useAuthContext();

  const { data: allBadges = [], isLoading: badgesLoading } = useQuery<BadgeType[]>({
    queryKey: ['/api/badges'],
  });

  const { data: userBadges = [], isLoading: userBadgesLoading } = useQuery<UserBadge[]>({
    queryKey: ['/api/badges/user'],
  });

  const isLoading = badgesLoading || userBadgesLoading;

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));

  const earnedBadges = allBadges.filter(badge => earnedBadgeIds.has(badge.id));
  const lockedBadges = allBadges.filter(badge => !earnedBadgeIds.has(badge.id));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Your Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading badges...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" data-testid="heading-badges">
          <Award className="w-5 h-5 text-yellow-500" />
          Your Badges
          <Badge variant="outline" className="ml-auto">
            {earnedBadges.length} / {allBadges.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Earned Badges */}
          {earnedBadges.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">Earned</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {earnedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-lg border bg-gradient-to-br ${rarityGradients[badge.rarity]} hover:scale-105 transition-transform`}
                    data-testid={`badge-earned-${badge.id}`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      <p className="font-medium text-sm mb-1">{badge.name}</p>
                      <Badge variant="outline" className={`text-xs ${rarityColors[badge.rarity]}`}>
                        {badge.rarity}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked Badges */}
          {lockedBadges.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">Locked</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {lockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-4 rounded-lg border bg-muted/30 opacity-60 relative"
                    data-testid={`badge-locked-${badge.id}`}
                  >
                    <div className="absolute top-2 right-2">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <div className="text-4xl mb-2 grayscale">{badge.icon}</div>
                      <p className="font-medium text-sm mb-1">{badge.name}</p>
                      <Badge variant="outline" className={`text-xs ${rarityColors[badge.rarity]}`}>
                        {badge.rarity}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {earnedBadges.length === 0 && (
            <div className="text-center py-8">
              <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No badges earned yet</p>
              <p className="text-sm text-muted-foreground mt-1">Complete battles to earn badges!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
