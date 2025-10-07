import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { CheckCircle2, Circle, Flame, TrendingUp, Plus, Target, Pencil, Trash2, BarChart3, RotateCcw } from 'lucide-react';
import { ref, get, set, update } from 'firebase/database';
import { db } from '@/shared/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';
import { useLongPress } from '@/shared/hooks/use-long-press';

type Habit = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  frequency: 'daily' | 'weekly';
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  isActive: boolean;
};

type HabitCompletion = {
  habitId: string;
  date: string;
  completed: boolean;
};

export default function Habits() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [statsHabit, setStatsHabit] = useState<Habit | null>(null);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: 'Health',
    frequency: 'daily' as 'daily' | 'weekly',
  });
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadHabits();
  }, [currentUser]);

  const loadHabits = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const habitsRef = ref(db, `habits/${currentUser.uid}`);
      const snapshot = await get(habitsRef);
      if (snapshot.exists()) {
        const habitsData = snapshot.val();
        const habitsList = Object.keys(habitsData).map(key => ({
          id: key,
          ...habitsData[key]
        })).filter((h: Habit) => h.isActive);
        setHabits(habitsList);

        const completionsData: Record<string, boolean> = {};
        for (const habit of habitsList) {
          const completionRef = ref(db, `habitCompletions/${currentUser.uid}/${habit.id}/${today}`);
          const completionSnapshot = await get(completionRef);
          completionsData[habit.id] = completionSnapshot.exists() && completionSnapshot.val().completed;
        }
        setCompletions(completionsData);
      }
    } catch (error) {
      console.error('Failed to load habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async () => {
    if (!currentUser || !newHabit.name) return;
    
    try {
      const habitId = `habit_${Date.now()}`;
      const habitData = {
        userId: currentUser.uid,
        name: newHabit.name,
        description: newHabit.description,
        category: newHabit.category,
        frequency: newHabit.frequency,
        currentStreak: 0,
        bestStreak: 0,
        totalCompletions: 0,
        isActive: true,
      };

      const habitRef = ref(db, `habits/${currentUser.uid}/${habitId}`);
      await set(habitRef, habitData);
      await loadHabits();
      
      setShowAddDialog(false);
      setNewHabit({
        name: '',
        description: '',
        category: 'Health',
        frequency: 'daily',
      });
      
      toast({
        title: "Habit created!",
        description: "Start building your streak today.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create habit.",
        variant: "destructive",
      });
    }
  };

  const toggleHabitCompletion = async (habit: Habit) => {
    if (!currentUser) return;
    
    const isCurrentlyCompleted = completions[habit.id];
    const newCompletedState = !isCurrentlyCompleted;
    
    try {
      const completionRef = ref(db, `habitCompletions/${currentUser.uid}/${habit.id}/${today}`);
      await set(completionRef, {
        habitId: habit.id,
        date: today,
        completed: newCompletedState,
      });

      let newStreak = habit.currentStreak;
      if (newCompletedState) {
        newStreak = habit.currentStreak + 1;
        if (newStreak > habit.bestStreak) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } else {
        newStreak = 0;
      }

      const habitRef = ref(db, `habits/${currentUser.uid}/${habit.id}`);
      await update(habitRef, {
        currentStreak: newStreak,
        bestStreak: Math.max(newStreak, habit.bestStreak),
        totalCompletions: habit.totalCompletions + (newCompletedState ? 1 : -1)
      });

      setCompletions({ ...completions, [habit.id]: newCompletedState });
      await loadHabits();
      
      if (newCompletedState) {
        toast({
          title: "Great job!",
          description: `${newStreak} day streak on ${habit.name}!`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update habit.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setShowEditDialog(true);
  };

  const updateHabit = async () => {
    if (!currentUser || !editingHabit) return;
    try {
      const habitRef = ref(db, `habits/${currentUser.uid}/${editingHabit.id}`);
      await update(habitRef, {
        name: editingHabit.name,
        description: editingHabit.description,
        category: editingHabit.category,
        frequency: editingHabit.frequency,
      });
      await loadHabits();
      setShowEditDialog(false);
      setEditingHabit(null);
      toast({
        title: "Habit updated",
        description: "Your habit has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update habit.",
        variant: "destructive",
      });
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!currentUser) return;
    try {
      const habitRef = ref(db, `habits/${currentUser.uid}/${habitId}`);
      await update(habitRef, { isActive: false });
      await loadHabits();
      toast({
        title: "Habit deleted",
        description: "Habit removed from your list.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete habit.",
        variant: "destructive",
      });
    }
  };

  const resetStreak = async (habitId: string) => {
    if (!currentUser) return;
    try {
      const habitRef = ref(db, `habits/${currentUser.uid}/${habitId}`);
      await update(habitRef, { currentStreak: 0 });
      await loadHabits();
      toast({
        title: "Streak reset",
        description: "Habit streak has been reset to 0.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset streak.",
        variant: "destructive",
      });
    }
  };

  const viewStats = (habit: Habit) => {
    setStatsHabit(habit);
    setShowStatsDialog(true);
  };

  const totalCompleted = Object.values(completions).filter(Boolean).length;
  const completionRate = habits.length > 0 ? (totalCompleted / habits.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Habits
              </h1>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-habit">
                  <Plus className="w-4 h-4" />
                  Add Habit
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-add-habit">
                <DialogHeader>
                  <DialogTitle>Create New Habit</DialogTitle>
                  <DialogDescription>Start tracking a new habit today</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="habitName">Habit Name</Label>
                    <Input
                      id="habitName"
                      value={newHabit.name}
                      onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                      placeholder="e.g., Morning meditation"
                      data-testid="input-habit-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="habitDescription">Description (optional)</Label>
                    <Input
                      id="habitDescription"
                      value={newHabit.description}
                      onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                      placeholder="Why this habit matters"
                      data-testid="input-habit-description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="habitCategory">Category</Label>
                    <Input
                      id="habitCategory"
                      value={newHabit.category}
                      onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                      placeholder="e.g., Health, Productivity"
                      data-testid="input-habit-category"
                    />
                  </div>
                  <div>
                    <Label htmlFor="habitFrequency">Frequency</Label>
                    <Select
                      value={newHabit.frequency}
                      onValueChange={(value: 'daily' | 'weekly') => setNewHabit({ ...newHabit, frequency: value })}
                    >
                      <SelectTrigger id="habitFrequency" data-testid="select-habit-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addHabit} className="w-full" data-testid="button-save-habit">Create Habit</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {habits.length > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Today's Progress</span>
                  <span className="text-2xl font-bold">{totalCompleted}/{habits.length}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : habits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No habits yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Create your first habit to start building consistency
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <ContextMenu key={habit.id}>
                <ContextMenuTrigger asChild>
                  <Card 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      const wasLongPress = longPressTriggered;
                      setLongPressTriggered(false);
                      if (!wasLongPress) {
                        toggleHabitCompletion(habit);
                      }
                    }}
                    data-testid={`card-habit-${habit.id}`}
                    onTouchStart={(e) => {
                      const touch = e.touches[0];
                      const timer = setTimeout(() => {
                        setLongPressTriggered(true);
                        const event = new MouseEvent('contextmenu', {
                          bubbles: true,
                          cancelable: true,
                          view: window,
                          clientX: touch.clientX,
                          clientY: touch.clientY
                        });
                        e.currentTarget.dispatchEvent(event);
                      }, 500);
                      e.currentTarget.addEventListener('touchend', () => clearTimeout(timer), { once: true });
                      e.currentTarget.addEventListener('touchmove', () => clearTimeout(timer), { once: true });
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {completions[habit.id] ? (
                            <CheckCircle2 className="w-8 h-8 text-green-500" data-testid={`icon-completed-${habit.id}`} />
                          ) : (
                            <Circle className="w-8 h-8 text-muted-foreground" data-testid={`icon-pending-${habit.id}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{habit.name}</h3>
                              {habit.description && (
                                <p className="text-sm text-muted-foreground">{habit.description}</p>
                              )}
                            </div>
                            <Badge variant="outline">{habit.category}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Flame className="w-4 h-4 text-orange-500" />
                              <span className="font-medium">{habit.currentStreak}</span>
                              <span className="text-muted-foreground">day streak</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="font-medium">{habit.bestStreak}</span>
                              <span className="text-muted-foreground">best</span>
                            </div>
                            <div className="text-muted-foreground">
                              {habit.totalCompletions} total
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-56">
                  <ContextMenuItem onClick={(e) => { e.stopPropagation(); viewStats(habit); }} data-testid={`context-stats-${habit.id}`}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Statistics
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(habit); }} data-testid={`context-edit-${habit.id}`}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Habit
                  </ContextMenuItem>
                  <ContextMenuItem onClick={(e) => { e.stopPropagation(); resetStreak(habit.id); }} data-testid={`context-reset-${habit.id}`}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Streak
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem 
                    onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }} 
                    className="text-destructive focus:text-destructive"
                    data-testid={`context-delete-${habit.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Habit
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        )}

        {/* Edit Habit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent data-testid="dialog-edit-habit">
            <DialogHeader>
              <DialogTitle>Edit Habit</DialogTitle>
              <DialogDescription>Update your habit details</DialogDescription>
            </DialogHeader>
            {editingHabit && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editHabitName">Habit Name</Label>
                  <Input
                    id="editHabitName"
                    value={editingHabit.name}
                    onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                    placeholder="e.g., Morning meditation"
                    data-testid="input-edit-habit-name"
                  />
                </div>
                <div>
                  <Label htmlFor="editHabitDescription">Description (optional)</Label>
                  <Input
                    id="editHabitDescription"
                    value={editingHabit.description || ''}
                    onChange={(e) => setEditingHabit({ ...editingHabit, description: e.target.value })}
                    placeholder="Why this habit matters"
                    data-testid="input-edit-habit-description"
                  />
                </div>
                <div>
                  <Label htmlFor="editHabitCategory">Category</Label>
                  <Input
                    id="editHabitCategory"
                    value={editingHabit.category}
                    onChange={(e) => setEditingHabit({ ...editingHabit, category: e.target.value })}
                    placeholder="e.g., Health, Productivity"
                    data-testid="input-edit-habit-category"
                  />
                </div>
                <div>
                  <Label htmlFor="editHabitFrequency">Frequency</Label>
                  <Select
                    value={editingHabit.frequency}
                    onValueChange={(value: 'daily' | 'weekly') => setEditingHabit({ ...editingHabit, frequency: value })}
                  >
                    <SelectTrigger id="editHabitFrequency" data-testid="select-edit-habit-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={updateHabit} className="w-full" data-testid="button-update-habit">Update Habit</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Stats Dialog */}
        <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
          <DialogContent data-testid="dialog-habit-stats">
            <DialogHeader>
              <DialogTitle>Habit Statistics</DialogTitle>
              <DialogDescription>Track your progress</DialogDescription>
            </DialogHeader>
            {statsHabit && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">{statsHabit.name}</h3>
                  <Badge variant="outline" className="text-base">{statsHabit.category}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Flame className="w-6 h-6 text-orange-500" />
                      </div>
                      <p className="text-3xl font-bold">{statsHabit.currentStreak}</p>
                      <p className="text-sm text-muted-foreground">Current Streak</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <TrendingUp className="w-6 h-6 text-green-500" />
                      </div>
                      <p className="text-3xl font-bold">{statsHabit.bestStreak}</p>
                      <p className="text-sm text-muted-foreground">Best Streak</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-3xl font-bold">{statsHabit.totalCompletions}</p>
                      <p className="text-sm text-muted-foreground">Total Completions</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Target className="w-6 h-6 text-secondary" />
                      </div>
                      <p className="text-3xl font-bold">{statsHabit.frequency}</p>
                      <p className="text-sm text-muted-foreground">Frequency</p>
                    </CardContent>
                  </Card>
                </div>
                
                {statsHabit.description && (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">{statsHabit.description}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
