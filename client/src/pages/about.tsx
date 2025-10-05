import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Target, Users, Sparkles, Shield } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/settings">
          <button 
            className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">About The Circle</h1>
              <p className="text-muted-foreground mt-1">Productivity reimagined with AI</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Circle is designed to help you achieve your goals through intelligent planning, 
                habit formation, and community support. We believe that productivity isn't just about 
                doing more—it's about doing what matters with intention and focus.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">AI-Powered Planning</h3>
                    <p className="text-sm text-muted-foreground">
                      Smart daily schedules that adapt to your goals and priorities, powered by advanced AI.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Community Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect with others, share motivation, and grow together in a supportive environment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Habit Formation</h3>
                    <p className="text-sm text-muted-foreground">
                      Build lasting habits with streak tracking, AI nudges, and gamification features.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Privacy First</h3>
                    <p className="text-sm text-muted-foreground">
                      Your data is encrypted and secure. We never share your information with third parties.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Created By</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Circle is created by <strong>ACO Network</strong>, developed by <strong>Nikil Nikesh (Splash Pro)</strong>. 
                Our goal is to empower individuals to reach their full potential through technology and community.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Key Features</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>AI-powered daily planner with intelligent scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Multimodal AI chat assistant (text, images, audio, documents)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Habit tracking with streak counters and gamification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Focus mode for distraction-free work sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Community feed with motivational posts and engagement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Progressive Web App (PWA) - install on any device</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
