import { Link } from 'wouter';
import { Info } from 'lucide-react';

export default function VersionFooter() {
  const version = '1.0.0'; // Synced with package.json
  const buildDate = '2025-10-06';

  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link href="/changelog">
              <button 
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                data-testid="link-version"
              >
                <Info className="w-3 h-3" />
                <span>Version {version}</span>
              </button>
            </Link>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Build {buildDate}</span>
          </div>
          <div className="text-xs">
            <span className="hidden sm:inline">The Circle by </span>
            <span className="font-medium">ACO Network</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
