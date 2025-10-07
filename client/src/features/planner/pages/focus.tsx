import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clock, Play, Pause, RotateCcw, Coffee, Zap, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type SessionStatus = 'idle' | 'focus' | 'break' | 'paused';

export default function Focus() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [totalTime, setTotalTime] = useState(focusDuration * 60);
  const [distractions, setDistractions] = useState(0);
  const [showDistractionDialog, setShowDistractionDialog] = useState(false);
  const [distractionNote, setDistractionNote] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sessionStatus === 'focus' || sessionStatus === 'break') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionStatus]);

  const handleTimerComplete = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (sessionStatus === 'focus') {
      playSound();
      toast({
        title: "Focus session complete!",
        description: "Time for a well-deserved break.",
      });
      startBreak();
    } else if (sessionStatus === 'break') {
      playSound();
      toast({
        title: "Break time over!",
        description: "Ready for another focused session?",
      });
      setSessionStatus('idle');
    }
  };

  const playSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const startFocus = () => {
    const time = focusDuration * 60;
    setTimeLeft(time);
    setTotalTime(time);
    setSessionStatus('focus');
    setDistractions(0);
  };

  const startBreak = () => {
    const time = breakDuration * 60;
    setTimeLeft(time);
    setTotalTime(time);
    setSessionStatus('break');
  };

  const togglePause = () => {
    if (sessionStatus === 'paused') {
      setSessionStatus(totalTime === focusDuration * 60 ? 'focus' : 'break');
    } else {
      setSessionStatus('paused');
    }
  };

  const reset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setSessionStatus('idle');
    setTimeLeft(focusDuration * 60);
    setDistractions(0);
  };

  const logDistraction = () => {
    setDistractions(distractions + 1);
    setShowDistractionDialog(true);
  };

  const saveDistraction = async () => {
    if (!currentUser) return;
    
    try {
      toast({
        title: "Distraction logged",
        description: "Stay focused! You can do this.",
      });
      setShowDistractionDialog(false);
      setDistractionNote('');
    } catch (error) {
      console.error('Failed to log distraction:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Focus Mode
            </h1>
          </div>
          <p className="text-muted-foreground">AI-powered Pomodoro technique for maximum productivity</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <div className="text-8xl font-bold mb-4 font-mono" data-testid="text-timer">
                {formatTime(timeLeft)}
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                {sessionStatus === 'idle' && 'Ready to focus?'}
                {sessionStatus === 'focus' && 'Stay focused!'}
                {sessionStatus === 'break' && 'Enjoy your break'}
                {sessionStatus === 'paused' && 'Paused'}
              </p>
              <Progress value={progress} className="h-2 mb-6" data-testid="progress-timer" />
            </div>

            {sessionStatus === 'idle' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="focusDuration">Focus Duration (min)</Label>
                    <Input
                      id="focusDuration"
                      type="number"
                      min="1"
                      max="120"
                      value={focusDuration}
                      onChange={(e) => setFocusDuration(parseInt(e.target.value) || 25)}
                      data-testid="input-focus-duration"
                    />
                  </div>
                  <div>
                    <Label htmlFor="breakDuration">Break Duration (min)</Label>
                    <Input
                      id="breakDuration"
                      type="number"
                      min="1"
                      max="30"
                      value={breakDuration}
                      onChange={(e) => setBreakDuration(parseInt(e.target.value) || 5)}
                      data-testid="input-break-duration"
                    />
                  </div>
                </div>
                <Button onClick={startFocus} className="w-full gap-2" size="lg" data-testid="button-start">
                  <Play className="w-5 h-5" />
                  Start Focus Session
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={togglePause} 
                  className="flex-1 gap-2"
                  variant={sessionStatus === 'paused' ? 'default' : 'outline'}
                  data-testid="button-pause"
                >
                  {sessionStatus === 'paused' ? (
                    <>
                      <Play className="w-4 h-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  )}
                </Button>
                <Button onClick={reset} variant="outline" className="flex-1 gap-2" data-testid="button-reset">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {sessionStatus === 'focus' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Distractions Today</h3>
                  <p className="text-sm text-muted-foreground">Track what breaks your focus</p>
                </div>
                <div className="text-3xl font-bold text-primary">{distractions}</div>
              </div>
              <Button 
                onClick={logDistraction} 
                variant="outline" 
                className="w-full gap-2"
                data-testid="button-log-distraction"
              >
                <AlertTriangle className="w-4 h-4" />
                Log Distraction
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={showDistractionDialog} onOpenChange={setShowDistractionDialog}>
          <DialogContent data-testid="dialog-distraction">
            <DialogHeader>
              <DialogTitle>Log Distraction</DialogTitle>
              <DialogDescription>
                What distracted you? (optional)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={distractionNote}
                onChange={(e) => setDistractionNote(e.target.value)}
                placeholder="e.g., Social media notification, colleague interruption..."
                rows={3}
                data-testid="textarea-distraction-note"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={saveDistraction} 
                  className="flex-1"
                  data-testid="button-save-distraction"
                >
                  Save
                </Button>
                <Button 
                  onClick={() => setShowDistractionDialog(false)} 
                  variant="outline"
                  className="flex-1"
                  data-testid="button-cancel-distraction"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Coffee className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Focus Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Silence your phone and close unnecessary tabs</li>
                  <li>• Let others know you're in focus mode</li>
                  <li>• Have water and snacks ready</li>
                  <li>• Take breaks seriously - they're part of the process</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
