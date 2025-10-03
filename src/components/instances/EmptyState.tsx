import { Server, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EmptyStateProps } from "@/types";

export function EmptyState({ onAddInstance }: EmptyStateProps) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardContent className="py-16 text-center">
        <div className="mb-6 relative inline-block">
          {/* Animated server icon */}
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-primary/10 flex items-center justify-center animate-pulse">
            <Server className="w-12 h-12 text-primary" />
          </div>
          {/* Plug animation indicator */}
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-ping" />
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-3">No Caddy instances yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Get started by adding your first Caddy instance. You can manage multiple servers from one place!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            onClick={onAddInstance}
            size="lg"
            className="bg-gradient-primary hover:shadow-glow transition-all"
          >
            Add Your First Instance
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.open('https://caddyserver.com/docs/api', '_blank')}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Quick Start Guide
          </Button>
        </div>

        {/* Helpful tips */}
        <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg max-w-2xl mx-auto text-left">
          <h4 className="font-semibold mb-2 text-sm">💡 Getting Started Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Default Admin API runs on <code className="px-1 py-0.5 bg-muted rounded">localhost:2019</code></li>
            <li>• Use mTLS or Bearer tokens for remote instances</li>
            <li>• Test connections before saving to verify connectivity</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
