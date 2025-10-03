import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, HelpCircle, Server } from "lucide-react";
import { Link } from "react-router-dom";

interface UpstreamsEmptyStateProps {
  type: 'no-reverse-proxy' | 'all-healthy' | 'no-instance';
  onRefresh?: () => void;
}

export function UpstreamsEmptyState({ type, onRefresh }: UpstreamsEmptyStateProps) {
  if (type === 'no-instance') {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <Server className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Instance Selected</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Please select a Caddy instance from the dropdown above to view its upstreams.
          </p>
          <Link to="/instances">
            <Button>Go to Instances</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (type === 'no-reverse-proxy') {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <HelpCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Reverse Proxy Configured</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            This Caddy instance doesn't have any reverse_proxy handlers configured yet.
            Configure a reverse proxy to start monitoring upstreams.
          </p>
          <div className="flex gap-3">
            <Link to="/config">
              <Button>Go to Configuration</Button>
            </Link>
            <Button variant="outline" asChild>
              <a 
                href="https://caddyserver.com/docs/caddyfile/directives/reverse_proxy" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Learn about reverse_proxy
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'all-healthy') {
    return (
      <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-500 mb-1">
              All Upstreams Healthy!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Everything is running smoothly. All your upstream backends are responding normally.
            </p>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Refresh Status
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
