import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Sparkles, Bug, Zap, Shield } from 'lucide-react';

const versionHistory = [
  {
    version: '1.0.0',
    date: '2025-10-06',
    type: 'major',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'Documentation page with comprehensive platform guides' },
      { type: 'feature', icon: Sparkles, text: 'Help & Support Center with FAQ and ticket system' },
      { type: 'feature', icon: CheckCircle, text: 'Support ticket submission with Firebase storage' },
      { type: 'feature', icon: CheckCircle, text: 'Version footer on all pages' },
      { type: 'feature', icon: CheckCircle, text: 'Changelog page for version history' },
    ],
  },
  {
    version: '0.9.0',
    date: '2025-10-05',
    type: 'minor',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'Progressive Web App (PWA) implementation' },
      { type: 'feature', icon: Sparkles, text: 'App installation support for all devices' },
      { type: 'feature', icon: CheckCircle, text: 'Offline support with service worker caching' },
      { type: 'feature', icon: CheckCircle, text: 'Push notification infrastructure' },
    ],
  },
  {
    version: '0.8.0',
    date: '2025-10-04',
    type: 'minor',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'Multimodal AI Chat with file upload support' },
      { type: 'feature', icon: Sparkles, text: 'Image, audio, and PDF analysis capabilities' },
      { type: 'security', icon: Shield, text: 'Enhanced security with SSRF prevention' },
      { type: 'security', icon: Shield, text: 'DOMPurify XSS protection for markdown' },
    ],
  },
  {
    version: '0.7.0',
    date: '2025-10-03',
    type: 'minor',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'Daily Planner with AI-powered scheduling' },
      { type: 'feature', icon: CheckCircle, text: 'Task editing and management system' },
      { type: 'improvement', icon: Zap, text: 'Improved mobile responsive design' },
    ],
  },
  {
    version: '0.6.0',
    date: '2025-10-02',
    type: 'minor',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'Habit tracking with streak system' },
      { type: 'feature', icon: Sparkles, text: 'AI habit nudges and motivation' },
      { type: 'feature', icon: CheckCircle, text: 'Focus Mode with Pomodoro timer' },
    ],
  },
  {
    version: '0.5.0',
    date: '2025-10-01',
    type: 'minor',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'Community features and groups' },
      { type: 'feature', icon: Sparkles, text: 'Motivational post feed' },
      { type: 'feature', icon: CheckCircle, text: 'Private messaging system' },
    ],
  },
  {
    version: '0.4.0',
    date: '2025-09-30',
    type: 'minor',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'Firebase Authentication integration' },
      { type: 'feature', icon: CheckCircle, text: 'User profile management' },
      { type: 'bug', icon: Bug, text: 'Fixed session persistence issues' },
    ],
  },
  {
    version: '0.3.0',
    date: '2025-09-29',
    type: 'minor',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'Basic AI chat assistant' },
      { type: 'feature', icon: CheckCircle, text: 'Google Gemini integration' },
    ],
  },
  {
    version: '0.2.0',
    date: '2025-09-28',
    type: 'minor',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'Dashboard and core UI components' },
      { type: 'feature', icon: CheckCircle, text: 'Dark mode theme system' },
    ],
  },
  {
    version: '0.1.0',
    date: '2025-09-27',
    type: 'patch',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'Initial project setup and architecture' },
      { type: 'feature', icon: CheckCircle, text: 'Basic routing and navigation' },
    ],
  },
];

const typeColors = {
  major: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  minor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  patch: 'bg-green-500/10 text-green-500 border-green-500/20',
};

const changeTypeColors = {
  feature: 'text-purple-500',
  improvement: 'text-blue-500',
  bug: 'text-orange-500',
  security: 'text-red-500',
};

export default function Changelog() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
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
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="heading-changelog">Changelog</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-muted-foreground" data-testid="text-intro">
            Track all updates, new features, improvements, and bug fixes for The Circle.
          </p>
        </div>

        <div className="space-y-6">
          {versionHistory.map((release) => (
            <Card key={release.version}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold" data-testid={`heading-version-${release.version}`}>
                        v{release.version}
                      </h2>
                      <Badge 
                        variant="outline" 
                        className={typeColors[release.type as keyof typeof typeColors]}
                        data-testid={`badge-type-${release.version}`}
                      >
                        {release.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-date-${release.version}`}>
                      Released on {release.date}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {release.changes.map((change, idx) => {
                    const Icon = change.icon;
                    return (
                      <div 
                        key={idx} 
                        className="flex items-start gap-3"
                        data-testid={`change-${release.version}-${idx}`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${changeTypeColors[change.type as keyof typeof changeTypeColors]}`} />
                        <p className="text-sm leading-relaxed">{change.text}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2" data-testid="heading-roadmap">What's Next?</h3>
            <p className="text-sm text-muted-foreground mb-3" data-testid="text-roadmap">
              We're constantly working to improve The Circle. Upcoming features include enhanced analytics, 
              team collaboration tools, and more AI-powered insights.
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-feedback">
              Have suggestions? <Link href="/help" className="text-primary hover:underline">Contact support</Link> to share your feedback.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
