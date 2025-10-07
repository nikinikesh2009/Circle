import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sword, Trophy, Users, Target, Clock, Zap, Award, Sparkles, Info, LogOut, TrendingUp, XCircle } from 'lucide-react';
import { apiRequest, queryClient } from '@/shared/lib/queryClient';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuthContext } from '@/shared/contexts/AuthContext';
import { type Battle } from '@shared/schema';
import { format, differenceInDays } from 'date-fns';
import BadgeShowcase from '@/shared/components/BadgeShowcase';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

export default function Battles() {
  const { currentUser } = useAuthContext();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const [newBattle, setNewBattle] = useState({
    type: '1v1' as '1v1' | 'group',
    challengeType: 'habit_streak' as 'habit_streak' | 'focus_time' | 'tasks_completed' | 'custom',
    customChallenge: '',
    opponentEmail: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });

  const { data: battles = [], isLoading: battlesLoading } = useQuery<Battle[]>({
    queryKey: ['/api/battles'],
  });

  const createBattleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/battles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/battles'] });
      setCreateDialogOpen(false);
      toast({
        title: 'Battle Created!',
        description: 'Your battle challenge has been sent.',
      });
      // Reset form
      setNewBattle({
        ...newBattle,
        opponentEmail: '',
        customChallenge: '',
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to create battle. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const handleCreateBattle = async () => {
    // Validate opponent email
    if (!newBattle.opponentEmail.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter an opponent email.',
        variant: 'destructive',
      });
      return;
    }

    // Validate custom challenge if challenge type is custom
    if (newBattle.challengeType === 'custom' && !newBattle.customChallenge.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please describe your custom challenge.',
        variant: 'destructive',
      });
      return;
    }

    // Validate dates
    if (new Date(newBattle.startDate) >= new Date(newBattle.endDate)) {
      toast({
        title: 'Invalid Dates',
        description: 'End date must be after start date.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Search for user by email
      const response = await apiRequest('GET', `/api/users/search?query=${encodeURIComponent(newBattle.opponentEmail)}`);
      const users = await response.json();

      if (!users || users.length === 0) {
        toast({
          title: 'User Not Found',
          description: 'No user found with that email. Please check and try again.',
          variant: 'destructive',
        });
        return;
      }

      const opponent = users[0];

      // Prevent user from battling themselves
      if (opponent.id === currentUser!.uid) {
        toast({
          title: 'Invalid Opponent',
          description: 'You cannot create a battle with yourself.',
          variant: 'destructive',
        });
        return;
      }

      const battleData = {
        type: newBattle.type,
        challengeType: newBattle.challengeType,
        customChallenge: newBattle.challengeType === 'custom' ? newBattle.customChallenge.trim() : undefined,
        participants: [currentUser!.uid, opponent.id],
        participantNames: {
          [currentUser!.uid]: currentUser!.email || 'You',
          [opponent.id]: opponent.email,
        },
        status: 'pending' as const,
        startDate: newBattle.startDate,
        endDate: newBattle.endDate,
        createdBy: currentUser!.uid,
      };

      createBattleMutation.mutate(battleData);
    } catch (error) {
      console.error('Error searching for user:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for user. Please check your connection and try again.',
        variant: 'destructive',
      });
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'habit_streak': return <Zap className="w-4 h-4" />;
      case 'focus_time': return <Target className="w-4 h-4" />;
      case 'tasks_completed': return <Trophy className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getChallengeLabel = (type: string) => {
    switch (type) {
      case 'habit_streak': return 'Habit Streak';
      case 'focus_time': return 'Focus Time';
      case 'tasks_completed': return 'Tasks Completed';
      default: return 'Custom Challenge';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelled': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const activeBattles = battles.filter(b => b.status === 'active' || b.status === 'pending');
  const completedBattles = battles.filter(b => b.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                <Sword className="w-5 h-5 text-purple-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold" data-testid="heading-battles">Battles</h1>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-create-battle">
                  <Sword className="w-4 h-4" />
                  <span className="hidden sm:inline">New Battle</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" data-testid="dialog-create-battle">
                <DialogHeader>
                  <DialogTitle>Create Battle Challenge</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="battle-type">Battle Type</Label>
                    <Select
                      value={newBattle.type}
                      onValueChange={(value: '1v1' | 'group') => setNewBattle({ ...newBattle, type: value })}
                    >
                      <SelectTrigger id="battle-type" data-testid="select-battle-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1v1">1v1 Battle</SelectItem>
                        <SelectItem value="group">Group Battle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="challenge-type">Challenge Type</Label>
                    <Select
                      value={newBattle.challengeType}
                      onValueChange={(value: any) => setNewBattle({ ...newBattle, challengeType: value })}
                    >
                      <SelectTrigger id="challenge-type" data-testid="select-challenge-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="habit_streak">Habit Streak Battle</SelectItem>
                        <SelectItem value="focus_time">Focus Time Duel</SelectItem>
                        <SelectItem value="tasks_completed">Task Completion Race</SelectItem>
                        <SelectItem value="custom">Custom Challenge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newBattle.challengeType === 'custom' && (
                    <div>
                      <Label htmlFor="custom-challenge">Custom Challenge</Label>
                      <Input
                        id="custom-challenge"
                        placeholder="Describe your challenge..."
                        value={newBattle.customChallenge}
                        onChange={(e) => setNewBattle({ ...newBattle, customChallenge: e.target.value })}
                        data-testid="input-custom-challenge"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="opponent-email">Opponent Email</Label>
                    <Input
                      id="opponent-email"
                      type="email"
                      placeholder="opponent@example.com"
                      value={newBattle.opponentEmail}
                      onChange={(e) => setNewBattle({ ...newBattle, opponentEmail: e.target.value })}
                      data-testid="input-opponent-email"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={newBattle.startDate}
                        onChange={(e) => setNewBattle({ ...newBattle, startDate: e.target.value })}
                        data-testid="input-start-date"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={newBattle.endDate}
                        onChange={(e) => setNewBattle({ ...newBattle, endDate: e.target.value })}
                        data-testid="input-end-date"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateBattle}
                    disabled={createBattleMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-battle"
                  >
                    {createBattleMutation.isPending ? 'Creating...' : 'Create Battle'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="gap-2" data-testid="tab-active">
              <Sword className="w-4 h-4" />
              Active ({activeBattles.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2" data-testid="tab-completed">
              <Trophy className="w-4 h-4" />
              Completed ({completedBattles.length})
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2" data-testid="tab-badges">
              <Award className="w-4 h-4" />
              Badges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {battlesLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading battles...</p>
              </div>
            ) : activeBattles.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Sword className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No active battles yet</p>
                  <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-first-battle">
                    Create Your First Battle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              activeBattles.map((battle) => (
                <BattleCard key={battle.id} battle={battle} currentUserId={currentUser!.uid} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedBattles.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No completed battles yet</p>
                </CardContent>
              </Card>
            ) : (
              completedBattles.map((battle) => (
                <BattleCard key={battle.id} battle={battle} currentUserId={currentUser!.uid} />
              ))
            )}
          </TabsContent>

          <TabsContent value="badges">
            <BadgeShowcase />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BattleCard({ battle, currentUserId }: { battle: Battle; currentUserId: string }) {
  const { toast } = useToast();
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progressPoints, setProgressPoints] = useState('');
  const isWinner = battle.winnerId === currentUserId;
  const daysRemaining = differenceInDays(new Date(battle.endDate), new Date());
  
  const leaveBattleMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/battles/${battle.id}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/battles'] });
      toast({
        title: 'Left Battle',
        description: 'You have left this battle.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to leave battle.',
        variant: 'destructive',
      });
    },
  });

  const reportProgressMutation = useMutation({
    mutationFn: async (points: number) => {
      return await apiRequest('PATCH', `/api/battles/${battle.id}/progress`, { points });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/battles'] });
      setShowProgressDialog(false);
      setProgressPoints('');
      toast({
        title: 'Progress Updated',
        description: 'Your battle progress has been recorded.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update progress.',
        variant: 'destructive',
      });
    },
  });

  const handleLeaveBattle = () => {
    if (confirm('Are you sure you want to leave this battle?')) {
      leaveBattleMutation.mutate();
    }
  };

  const handleReportProgress = () => {
    const points = parseInt(progressPoints);
    if (isNaN(points) || points < 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid number of points.',
        variant: 'destructive',
      });
      return;
    }
    reportProgressMutation.mutate(points);
  };
  
  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'habit_streak': return <Zap className="w-4 h-4" />;
      case 'focus_time': return <Target className="w-4 h-4" />;
      case 'tasks_completed': return <Trophy className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getChallengeLabel = (type: string) => {
    switch (type) {
      case 'habit_streak': return 'Habit Streak';
      case 'focus_time': return 'Focus Time';
      case 'tasks_completed': return 'Tasks Completed';
      default: return 'Custom Challenge';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <Card className={battle.status === 'completed' && isWinner ? 'border-yellow-500/50' : ''} data-testid={`card-battle-${battle.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getStatusColor(battle.status)}>
                      {battle.status}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      {getChallengeIcon(battle.challengeType)}
                      {getChallengeLabel(battle.challengeType)}
                    </Badge>
                    {battle.type === 'group' && (
                      <Badge variant="outline" className="gap-1">
                        <Users className="w-3 h-3" />
                        Group
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">
                    {battle.customChallenge || getChallengeLabel(battle.challengeType)}
                  </CardTitle>
                </div>
                {battle.status === 'completed' && isWinner && (
                  <Award className="w-8 h-8 text-yellow-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Participants */}
                <div className="grid grid-cols-2 gap-4">
                  {battle.participants.map((participantId) => (
                    <div
                      key={participantId}
                      className={`p-3 rounded-lg border ${
                        participantId === currentUserId
                          ? 'bg-primary/10 border-primary/20'
                          : 'bg-muted/50 border-border'
                      }`}
                      data-testid={`participant-${participantId}`}
                    >
                      <p className="text-sm font-medium truncate">
                        {battle.participantNames[participantId]}
                      </p>
                      <p className="text-2xl font-bold mt-1">
                        {battle.scores[participantId] || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  ))}
                </div>

                {/* Date Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {battle.status === 'active' && daysRemaining >= 0 ? (
                      <span>{daysRemaining} days remaining</span>
                    ) : battle.status === 'completed' ? (
                      <span>Completed {format(new Date(battle.completedAt || battle.endDate), 'MMM d')}</span>
                    ) : (
                      <span>Ends {format(new Date(battle.endDate), 'MMM d')}</span>
                    )}
                  </div>
                </div>

                {/* Winner Badge */}
                {battle.status === 'completed' && battle.winnerId && (
                  <div className={`p-3 rounded-lg ${isWinner ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-muted/50'}`}>
                    <p className="text-sm font-medium">
                      {isWinner ? '🎉 You won this battle!' : `Winner: ${battle.participantNames[battle.winnerId]}`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={() => setShowDetailsDialog(true)} data-testid={`context-details-${battle.id}`}>
            <Info className="w-4 h-4 mr-2" />
            View Details
          </ContextMenuItem>
          {battle.status === 'active' && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => setShowProgressDialog(true)} data-testid={`context-progress-${battle.id}`}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Report Progress
              </ContextMenuItem>
              <ContextMenuItem 
                onClick={handleLeaveBattle} 
                className="text-destructive focus:text-destructive"
                data-testid={`context-leave-${battle.id}`}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Battle
              </ContextMenuItem>
            </>
          )}
          {battle.status === 'pending' && battle.createdBy === currentUserId && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem 
                onClick={handleLeaveBattle} 
                className="text-destructive focus:text-destructive"
                data-testid={`context-cancel-${battle.id}`}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Battle
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent data-testid="dialog-battle-details">
          <DialogHeader>
            <DialogTitle>Battle Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Challenge Type</Label>
              <div className="flex items-center gap-2 mt-1">
                {getChallengeIcon(battle.challengeType)}
                <span>{getChallengeLabel(battle.challengeType)}</span>
              </div>
            </div>
            {battle.customChallenge && (
              <div>
                <Label>Challenge Description</Label>
                <p className="text-sm text-muted-foreground mt-1">{battle.customChallenge}</p>
              </div>
            )}
            <div>
              <Label>Duration</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(battle.startDate), 'MMM d, yyyy')} - {format(new Date(battle.endDate), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <Label>Status</Label>
              <Badge variant="outline" className={`${getStatusColor(battle.status)} mt-1`}>
                {battle.status}
              </Badge>
            </div>
            <div>
              <Label>Participants</Label>
              <div className="mt-2 space-y-2">
                {battle.participants.map((participantId) => (
                  <div key={participantId} className="flex justify-between items-center">
                    <span className="text-sm">{battle.participantNames[participantId]}</span>
                    <span className="font-bold">{battle.scores[participantId] || 0} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent data-testid="dialog-report-progress">
          <DialogHeader>
            <DialogTitle>Report Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="progress-points">Points to Add</Label>
              <Input
                id="progress-points"
                type="number"
                min="0"
                value={progressPoints}
                onChange={(e) => setProgressPoints(e.target.value)}
                placeholder="Enter points"
                data-testid="input-progress-points"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Current score: {battle.scores[currentUserId] || 0}
              </p>
            </div>
            <Button 
              onClick={handleReportProgress} 
              disabled={reportProgressMutation.isPending}
              className="w-full"
              data-testid="button-submit-progress"
            >
              {reportProgressMutation.isPending ? 'Updating...' : 'Update Progress'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
