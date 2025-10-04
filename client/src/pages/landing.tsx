import { Link } from 'wouter';
import { Zap, BarChart3, Users, ArrowRight, Sparkles } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl">
                <svg className="w-14 h-14 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                </svg>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary blur-2xl opacity-50 animate-pulse"></div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            The Circle
          </h1>
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-3xl mx-auto">
              Daily motivation, habit tracking, and community connection
            </p>
            <Sparkles className="w-6 h-6 text-secondary animate-pulse" />
          </div>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Build better habits one day at a time. Get motivated, track your progress, and connect with a community that grows together.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="group relative overflow-hidden bg-gradient-to-br from-card to-primary/5 border-2 border-border/50 rounded-3xl p-8 hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Daily Motivation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Start each day with inspiring content that keeps you moving forward and motivated to achieve your goals.
            </p>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-card to-secondary/5 border-2 border-border/50 rounded-3xl p-8 hover:border-secondary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-secondary/20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Streak Tracking</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Build momentum with visual progress tracking and streak counters that celebrate your consistency.
            </p>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-card to-accent/5 border-2 border-border/50 rounded-3xl p-8 hover:border-accent/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-accent/20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-3">Community</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connect with others on the same journey toward better habits and mutual support.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Link href="/register">
            <button 
              className="group px-10 py-5 bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground font-bold text-lg rounded-2xl hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 flex items-center gap-3"
              data-testid="button-get-started"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </Link>
          <Link href="/login">
            <button 
              className="px-10 py-5 bg-card/80 backdrop-blur-sm border-2 border-border/50 text-foreground font-bold text-lg rounded-2xl hover:border-primary/50 hover:bg-card transition-all duration-300 hover:scale-105 hover:shadow-xl"
              data-testid="button-sign-in"
            >
              Sign In
            </button>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-20 text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-muted-foreground">
            Join thousands of users building better habits every day
          </p>
        </div>
      </div>
    </div>
  );
}
