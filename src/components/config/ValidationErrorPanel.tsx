import { AlertCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ValidationErrorPanelProps } from '@/types';

export function ValidationErrorPanel({ errors, onGoToError }: ValidationErrorPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (errors.length === 0) return null;

  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>
          Validation Failed: {errorCount} {errorCount === 1 ? 'error' : 'errors'}
          {warningCount > 0 && `, ${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'}`}
        </span>
      </AlertTitle>
      <AlertDescription>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-0 h-auto mt-2">
              {isOpen ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Show Details
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {errors.map((error, index) => (
              <div
                key={index}
                className="p-3 rounded-md bg-background/50 border border-border space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {error.line !== undefined && (
                      <div className="text-xs font-mono text-muted-foreground mb-1">
                        Line {error.line}
                        {error.column !== undefined && `, Column ${error.column}`}
                      </div>
                    )}
                    <p className="text-sm">{error.message}</p>
                  </div>
                  {error.line !== undefined && onGoToError && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onGoToError(error.line!, error.column || 0)}
                    >
                      Go to Error
                    </Button>
                  )}
                </div>
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" asChild>
                  <a
                    href="https://caddyserver.com/docs/json/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn more about Caddy configuration
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </AlertDescription>
    </Alert>
  );
}
