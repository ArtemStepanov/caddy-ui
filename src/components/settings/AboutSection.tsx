import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ExternalLink,
  CheckCircle2,
  Github,
  BookOpen,
  MessageSquare,
  Bug,
  Star,
  Coffee,
} from 'lucide-react';

export const AboutSection = () => {
  const version = '1.2.3';
  const buildDate = '2025-10-01';
  const commitHash = 'abc123d';
  const backendVersion = '1.2.3';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">About</h2>
        <p className="text-muted-foreground">
          Application information and resources
        </p>
      </div>

      {/* Version Information */}
      <Card>
        <CardHeader>
          <CardTitle>Version Information</CardTitle>
          <CardDescription>Current application version and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Orchestrator Version</span>
              <Badge variant="outline">{version}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Build Date</span>
              <span className="text-sm text-muted-foreground">{buildDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Commit Hash</span>
              <a
                href={`https://github.com/yourusername/caddy-orchestrator/commit/${commitHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                {commitHash}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Up to date</span>
            </div>
            <Button variant="outline" size="sm">
              Check for Updates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Backend and system information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Backend API</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-600/10 text-green-600">
                Connected
              </Badge>
              <span className="text-sm text-muted-foreground">v{backendVersion}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">WebSocket</span>
            <Badge variant="secondary" className="bg-green-600/10 text-green-600">
              Active
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Database</span>
            <Badge variant="secondary" className="bg-green-600/10 text-green-600">
              Healthy (SQLite)
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cache</span>
            <span className="text-sm text-muted-foreground">2.3 MB used</span>
          </div>
        </CardContent>
      </Card>

      {/* Resources & Support */}
      <Card>
        <CardHeader>
          <CardTitle>Resources & Support</CardTitle>
          <CardDescription>Documentation, community, and support</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.open('https://docs.example.com', '_blank')}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Documentation
            <ExternalLink className="ml-auto h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() =>
              window.open('https://github.com/yourusername/caddy-orchestrator/discussions', '_blank')
            }
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Community Forum
            <ExternalLink className="ml-auto h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() =>
              window.open('https://github.com/yourusername/caddy-orchestrator/issues', '_blank')
            }
          >
            <Bug className="mr-2 h-4 w-4" />
            Report a Bug
            <ExternalLink className="ml-auto h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() =>
              window.open('https://github.com/yourusername/caddy-orchestrator', '_blank')
            }
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub Repository
            <ExternalLink className="ml-auto h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() =>
              window.open('https://github.com/yourusername/caddy-orchestrator', '_blank')
            }
          >
            <Star className="mr-2 h-4 w-4" />
            Star on GitHub
            <ExternalLink className="ml-auto h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.open('https://buymeacoffee.com/example', '_blank')}
          >
            <Coffee className="mr-2 h-4 w-4" />
            Support the Project
            <ExternalLink className="ml-auto h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* License & Credits */}
      <Card>
        <CardHeader>
          <CardTitle>License & Credits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm">
              Licensed under{' '}
              <a
                href="https://opensource.org/licenses/MIT"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                MIT License
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ using Caddy Server, React, and Go
            </p>
          </div>
          <Button variant="outline" size="sm">
            View Open Source Licenses
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
