import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Search, 
  BookOpen, 
  Brain, 
  Calendar, 
  Target, 
  Clock, 
  Users, 
  MessageSquare,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const docSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    items: [
      { id: 'intro', title: 'Introduction to The Circle', content: 'The Circle is a comprehensive productivity platform that combines AI-powered planning, habit tracking, focus mode, and community support. Our platform helps you achieve your goals through intelligent scheduling and personalized guidance.' },
      { id: 'account', title: 'Creating Your Account', content: 'Sign up with your email to get started. Once registered, you\'ll have access to all features including AI chat, daily planner, habits tracker, focus mode, and community features.' },
      { id: 'first-steps', title: 'First Steps', content: 'After logging in, start by exploring the Dashboard. Set up your first habit, create a daily plan, or chat with our AI assistant to get personalized recommendations for your productivity journey.' },
    ],
  },
  {
    id: 'ai-chat',
    title: 'AI Chat Assistant',
    icon: Brain,
    items: [
      { id: 'ai-overview', title: 'AI Chat Overview', content: 'Our multimodal AI assistant powered by Google Gemini can help with text conversations, image analysis, audio transcription, and document understanding. Access it from the AI Chat page.' },
      { id: 'file-upload', title: 'Uploading Files', content: 'You can upload images (JPG, PNG, GIF), audio files (MP3, WAV), and PDF documents. Maximum file size is 10MB. The AI will analyze and provide insights based on your files.' },
      { id: 'ai-tips', title: 'Getting the Best Results', content: 'Be specific in your questions. Provide context when asking for advice. Use the file upload feature to get visual or audio content analyzed by the AI.' },
    ],
  },
  {
    id: 'daily-planner',
    title: 'Daily Planner',
    icon: Calendar,
    items: [
      { id: 'planner-overview', title: 'Daily Planner Overview', content: 'The AI-powered daily planner creates optimized schedules based on your description of the day. Simply describe what you need to accomplish, and let AI organize your tasks.' },
      { id: 'task-categories', title: 'Task Categories', content: 'Tasks are organized into categories: Study, Work, Gym, Meal, Break, Personal, Social, and Other. Each category has a unique color for easy visual identification.' },
      { id: 'editing-tasks', title: 'Editing Tasks', content: 'Click the Edit button on any task to modify its title, description, category, priority, start time, and end time. Changes are saved automatically.' },
      { id: 'task-status', title: 'Task Status', content: 'Mark tasks as completed, in progress, skipped, or postponed. Your completion rate helps the AI learn your patterns and improve future schedules.' },
    ],
  },
  {
    id: 'habits',
    title: 'Habits & Goals',
    icon: Target,
    items: [
      { id: 'habits-overview', title: 'Habit Tracking', content: 'Build lasting habits with our streak tracking system. Create daily or custom frequency habits, set reminders, and watch your streaks grow.' },
      { id: 'streak-system', title: 'Streak System', content: 'Complete your habits consistently to build streaks. Your current streak and best streak are displayed. Missing a day resets your current streak.' },
      { id: 'ai-nudges', title: 'AI Habit Nudges', content: 'Enable AI nudges to receive personalized motivational messages that adapt to your progress. The AI learns your patterns and provides timely encouragement.' },
      { id: 'goals', title: 'Setting Goals', content: 'Set specific goals linked to your habits. Track progress with visual indicators. AI can generate micro-steps to help you achieve larger goals.' },
    ],
  },
  {
    id: 'focus-mode',
    title: 'Focus Mode',
    icon: Clock,
    items: [
      { id: 'focus-overview', title: 'Focus Mode Overview', content: 'Focus Mode helps you concentrate on important tasks with customizable timers, break intervals, and distraction tracking.' },
      { id: 'pomodoro', title: 'Pomodoro Technique', content: 'Use the built-in Pomodoro timer (25 minutes work, 5 minutes break) or customize durations to match your workflow. The timer runs in the background.' },
      { id: 'distractions', title: 'Tracking Distractions', content: 'Log distractions during focus sessions to identify patterns. The AI analyzes your distraction logs and provides insights to improve focus.' },
    ],
  },
  {
    id: 'community',
    title: 'Community Features',
    icon: Users,
    items: [
      { id: 'community-overview', title: 'Community Overview', content: 'Connect with other users, share progress, and get motivation from the community. Like posts, join groups, and participate in discussions.' },
      { id: 'motivational-feed', title: 'Motivational Feed', content: 'Browse daily motivational posts curated by admins. Like posts to show appreciation and share motivation with the community.' },
      { id: 'groups', title: 'Groups', content: 'Join groups based on your interests or goals. Share progress updates, ask questions, and support group members on their journeys.' },
      { id: 'messaging', title: 'Private Messaging', content: 'Send direct messages to other users. Build accountability partnerships and support networks within the platform.' },
    ],
  },
  {
    id: 'pwa',
    title: 'Progressive Web App',
    icon: Sparkles,
    items: [
      { id: 'pwa-overview', title: 'Install as App', content: 'The Circle is a Progressive Web App (PWA) that can be installed on any device. Use it like a native app on iOS, Android, Windows, Mac, or Linux.' },
      { id: 'offline', title: 'Offline Support', content: 'Once installed, the app caches resources for offline access. You can view your data and navigate the app even without an internet connection.' },
      { id: 'notifications', title: 'Push Notifications', content: 'Enable push notifications to receive reminders for habits, tasks, and focus sessions. Notifications work even when the app is closed.' },
    ],
  },
];

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState(docSections[0]);
  const [selectedItem, setSelectedItem] = useState(docSections[0].items[0]);

  const filteredSections = docSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(section => section.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/settings">
              <button 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="heading-documentation">Documentation</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-docs"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardContent className="p-4">
                <h2 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide" data-testid="heading-sections">Sections</h2>
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-1">
                    {filteredSections.map((section) => {
                      const Icon = section.icon;
                      const isActive = selectedSection.id === section.id;
                      return (
                        <button
                          key={section.id}
                          onClick={() => {
                            setSelectedSection(section);
                            setSelectedItem(section.items[0]);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                            isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                          }`}
                          data-testid={`button-section-${section.id}`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{section.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  {(() => {
                    const Icon = selectedSection.icon;
                    return <Icon className="w-6 h-6 text-primary" />;
                  })()}
                  <h2 className="text-2xl font-bold" data-testid="heading-section-title">{selectedSection.title}</h2>
                </div>

                <div className="space-y-4">
                  {selectedSection.items.map((item) => {
                    const isActive = selectedItem.id === item.id;
                    return (
                      <div key={item.id} className="border-l-2 border-border pl-4">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className={`w-full text-left group ${isActive ? 'text-primary' : ''}`}
                          data-testid={`button-item-${item.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors" data-testid={`heading-item-${item.id}`}>
                              {item.title}
                            </h3>
                            <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                          </div>
                        </button>
                        {isActive && (
                          <p className="text-muted-foreground leading-relaxed mt-2" data-testid={`text-content-${item.id}`}>
                            {item.content}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2" data-testid="heading-need-help">Need More Help?</h3>
                    <p className="text-sm text-muted-foreground mb-4" data-testid="text-need-help">
                      Can't find what you're looking for? Visit our Help Center or contact support.
                    </p>
                    <Link href="/help">
                      <button 
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                        data-testid="button-help-center"
                      >
                        Go to Help Center
                      </button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
