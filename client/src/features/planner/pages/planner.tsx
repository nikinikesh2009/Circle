import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { Calendar, Clock, Plus, CheckCircle2, Circle, PlayCircle, XCircle, AlertCircle, Pencil, Trash2, Copy, Flag } from 'lucide-react';
import { ref, get, set, update, remove } from 'firebase/database';
import { db } from '@/shared/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/shared/lib/queryClient';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger } from '@/components/ui/context-menu';
import { useLongPress } from '@/shared/hooks/use-long-press';

type Task = {
  id: string;
  userId: string;
  planId: string;
  title: string;
  description?: string;
  category: 'study' | 'work' | 'gym' | 'meal' | 'break' | 'personal' | 'social' | 'other';
  startTime: string;
  endTime: string;
  duration: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'postponed';
};

const categoryColors = {
  study: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  work: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  gym: 'bg-green-500/10 text-green-500 border-green-500/20',
  meal: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  break: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  personal: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  social: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function Planner() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'work' as Task['category'],
    startTime: '09:00',
    endTime: '10:00',
    priority: 'medium' as Task['priority'],
  });

  useEffect(() => {
    loadTasks();
  }, [currentUser, selectedDate]);

  const loadTasks = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const tasksRef = ref(db, `tasks/${currentUser.uid}/${selectedDate}`);
      const snapshot = await get(tasksRef);
      if (snapshot.exists()) {
        const tasksData = snapshot.val();
        const tasksList = Object.keys(tasksData).map(key => ({
          id: key,
          ...tasksData[key]
        })).sort((a, b) => a.startTime.localeCompare(b.startTime));
        setTasks(tasksList);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setShowEditDialog(true);
  };

  const updateTask = async () => {
    if (!currentUser || !editingTask) return;
    
    try {
      const [startHour, startMin] = editingTask.startTime.split(':').map(Number);
      const [endHour, endMin] = editingTask.endTime.split(':').map(Number);
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      
      const taskRef = ref(db, `tasks/${currentUser.uid}/${selectedDate}/${editingTask.id}`);
      await update(taskRef, {
        title: editingTask.title,
        description: editingTask.description,
        category: editingTask.category,
        startTime: editingTask.startTime,
        endTime: editingTask.endTime,
        duration,
        priority: editingTask.priority,
      });
      
      await loadTasks();
      setShowEditDialog(false);
      setEditingTask(null);
      
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive",
      });
    }
  };

  const addTask = async () => {
    if (!currentUser || !newTask.title) return;
    
    try {
      const taskId = `task_${Date.now()}`;
      const [startHour, startMin] = newTask.startTime.split(':').map(Number);
      const [endHour, endMin] = newTask.endTime.split(':').map(Number);
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      
      const taskData = {
        userId: currentUser.uid,
        planId: `plan_${Date.now()}`,
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        startTime: newTask.startTime,
        endTime: newTask.endTime,
        duration,
        priority: newTask.priority,
        status: 'pending',
      };

      const taskRef = ref(db, `tasks/${currentUser.uid}/${selectedDate}/${taskId}`);
      await set(taskRef, taskData);
      await loadTasks();
      
      setShowAddDialog(false);
      setNewTask({
        title: '',
        description: '',
        category: 'work',
        startTime: '09:00',
        endTime: '10:00',
        priority: 'medium',
      });
      
      toast({
        title: "Task added",
        description: "Your task has been added to the schedule.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add task.",
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    if (!currentUser) return;
    try {
      const taskRef = ref(db, `tasks/${currentUser.uid}/${selectedDate}/${taskId}`);
      await update(taskRef, { status: newStatus });
      await loadTasks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!currentUser) return;
    try {
      const taskRef = ref(db, `tasks/${currentUser.uid}/${selectedDate}/${taskId}`);
      await remove(taskRef);
      await loadTasks();
      toast({
        title: "Task deleted",
        description: "Task removed from schedule.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    }
  };

  const duplicateTask = async (task: Task) => {
    if (!currentUser) return;
    try {
      const taskId = `task_${Date.now()}`;
      const taskData = {
        userId: currentUser.uid,
        planId: `plan_${Date.now()}`,
        title: `${task.title} (Copy)`,
        description: task.description,
        category: task.category,
        startTime: task.startTime,
        endTime: task.endTime,
        duration: task.duration,
        priority: task.priority,
        status: 'pending',
      };

      const taskRef = ref(db, `tasks/${currentUser.uid}/${selectedDate}/${taskId}`);
      await set(taskRef, taskData);
      await loadTasks();
      
      toast({
        title: "Task duplicated",
        description: "A copy of the task has been created.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate task.",
        variant: "destructive",
      });
    }
  };

  const changePriority = async (taskId: string, priority: Task['priority']) => {
    if (!currentUser) return;
    try {
      const taskRef = ref(db, `tasks/${currentUser.uid}/${selectedDate}/${taskId}`);
      await update(taskRef, { priority });
      await loadTasks();
      toast({
        title: "Priority updated",
        description: `Task priority changed to ${priority}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update priority.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="w-5 h-5 text-blue-500" />;
      case 'skipped':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      case 'postponed':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Daily Planner
              </h1>
            </div>
          </div>

          <Card className="mb-4 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-auto"
                  data-testid="input-date"
                />
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 w-full sm:w-auto" data-testid="button-add-task">
                      <Plus className="w-4 h-4" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                <DialogContent data-testid="dialog-add-task">
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>Create a new task for your schedule</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="taskTitle">Title</Label>
                      <Input
                        id="taskTitle"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Task name"
                        data-testid="input-task-title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="taskDescription">Description (optional)</Label>
                      <Textarea
                        id="taskDescription"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        placeholder="Task details"
                        data-testid="input-task-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="taskCategory">Category</Label>
                        <Select
                          value={newTask.category}
                          onValueChange={(value: Task['category']) => setNewTask({ ...newTask, category: value })}
                        >
                          <SelectTrigger id="taskCategory" data-testid="select-task-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="study">Study</SelectItem>
                            <SelectItem value="work">Work</SelectItem>
                            <SelectItem value="gym">Gym</SelectItem>
                            <SelectItem value="meal">Meal</SelectItem>
                            <SelectItem value="break">Break</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="social">Social</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="taskPriority">Priority</Label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(value: Task['priority']) => setNewTask({ ...newTask, priority: value })}
                        >
                          <SelectTrigger id="taskPriority" data-testid="select-task-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={newTask.startTime}
                          onChange={(e) => setNewTask({ ...newTask, startTime: e.target.value })}
                          data-testid="input-start-time"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={newTask.endTime}
                          onChange={(e) => setNewTask({ ...newTask, endTime: e.target.value })}
                          data-testid="input-end-time"
                        />
                      </div>
                    </div>
                    <Button onClick={addTask} className="w-full" data-testid="button-save-task">Add Task</Button>
                  </div>
                </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
          
          {totalTasks > 0 && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{completedTasks} of {totalTasks} tasks completed</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                  style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks scheduled</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Add tasks to start planning your day
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <ContextMenu key={task.id}>
                <ContextMenuTrigger>
                  <Card className="hover:shadow-md transition-shadow" data-testid={`card-task-${task.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-base md:text-lg">{task.title}</h3>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge variant="outline" className={categoryColors[task.category]}>
                              {task.category}
                            </Badge>
                            <Badge className={priorityColors[task.priority]}>
                              {task.priority}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.startTime} - {task.endTime}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {task.duration} min
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            {task.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTaskStatus(task.id, 'completed')}
                                data-testid={`button-complete-${task.id}`}
                                className="w-full sm:w-auto"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Complete
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(task)}
                              data-testid={`button-edit-${task.id}`}
                              className="w-full sm:w-auto"
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTask(task.id)}
                              data-testid={`button-delete-${task.id}`}
                              className="w-full sm:w-auto text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-56">
                  {task.status !== 'completed' && (
                    <>
                      <ContextMenuItem onClick={() => updateTaskStatus(task.id, 'completed')} data-testid={`context-complete-${task.id}`}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark Complete
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                    </>
                  )}
                  <ContextMenuItem onClick={() => openEditDialog(task)} data-testid={`context-edit-${task.id}`}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Task
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => duplicateTask(task)} data-testid={`context-duplicate-${task.id}`}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </ContextMenuItem>
                  <ContextMenuSub>
                    <ContextMenuSubTrigger data-testid={`context-priority-${task.id}`}>
                      <Flag className="w-4 h-4 mr-2" />
                      Change Priority
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      <ContextMenuItem onClick={() => changePriority(task.id, 'low')}>
                        Low Priority
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => changePriority(task.id, 'medium')}>
                        Medium Priority
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => changePriority(task.id, 'high')}>
                        High Priority
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => changePriority(task.id, 'urgent')}>
                        Urgent Priority
                      </ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                  <ContextMenuSeparator />
                  <ContextMenuItem 
                    onClick={() => deleteTask(task.id)} 
                    className="text-destructive focus:text-destructive"
                    data-testid={`context-delete-${task.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Task
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        )}

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent data-testid="dialog-edit-task">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>Update your task details</DialogDescription>
            </DialogHeader>
            {editingTask && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editTaskTitle">Title</Label>
                  <Input
                    id="editTaskTitle"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    placeholder="Task name"
                    data-testid="input-edit-task-title"
                  />
                </div>
                <div>
                  <Label htmlFor="editTaskDescription">Description (optional)</Label>
                  <Textarea
                    id="editTaskDescription"
                    value={editingTask.description || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                    placeholder="Task details"
                    data-testid="input-edit-task-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editTaskCategory">Category</Label>
                    <Select
                      value={editingTask.category}
                      onValueChange={(value: Task['category']) => setEditingTask({ ...editingTask, category: value })}
                    >
                      <SelectTrigger id="editTaskCategory" data-testid="select-edit-task-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="study">Study</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="gym">Gym</SelectItem>
                        <SelectItem value="meal">Meal</SelectItem>
                        <SelectItem value="break">Break</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editTaskPriority">Priority</Label>
                    <Select
                      value={editingTask.priority}
                      onValueChange={(value: Task['priority']) => setEditingTask({ ...editingTask, priority: value })}
                    >
                      <SelectTrigger id="editTaskPriority" data-testid="select-edit-task-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editStartTime">Start Time</Label>
                    <Input
                      id="editStartTime"
                      type="time"
                      value={editingTask.startTime}
                      onChange={(e) => setEditingTask({ ...editingTask, startTime: e.target.value })}
                      data-testid="input-edit-start-time"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editEndTime">End Time</Label>
                    <Input
                      id="editEndTime"
                      type="time"
                      value={editingTask.endTime}
                      onChange={(e) => setEditingTask({ ...editingTask, endTime: e.target.value })}
                      data-testid="input-edit-end-time"
                    />
                  </div>
                </div>
                <Button onClick={updateTask} className="w-full" data-testid="button-update-task">Update Task</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
