import { useState, useEffect } from "react";
import { Server, CheckCircle2, XCircle, Loader2, Lightbulb, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CaddyInstance, HealthCheckResult } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface TestConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: CaddyInstance;
  onTest: (id: string) => Promise<HealthCheckResult | null>;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'failure';

export function TestConnectionDialog({ 
  open, 
  onOpenChange, 
  instance, 
  onTest 
}: TestConnectionDialogProps) {
  const [status, setStatus] = useState<TestStatus>('idle');
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Auto-start test when dialog opens
      handleTest();
    } else {
      // Reset state when dialog closes
      setStatus('idle');
      setResult(null);
      setProgress(0);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleTest = async () => {
    setStatus('testing');
    setProgress(0);
    setError(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const testResult = await onTest(instance.id);
      clearInterval(progressInterval);
      setProgress(100);
      
      if (testResult) {
        setResult(testResult);
        setStatus(testResult.healthy ? 'success' : 'failure');
      } else {
        setStatus('failure');
        setError('No response from instance');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(100);
      setStatus('failure');
      setError(err instanceof Error ? err.message : 'Connection test failed');
    }
  };

  const handleClose = () => {
    if (status !== 'testing') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Testing Connection to {instance.name}</DialogTitle>
          <DialogDescription>
            Verifying connectivity to the Caddy Admin API
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {status === 'idle' && (
            <div className="text-center py-8">
              <Server className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Ready to test connection</p>
            </div>
          )}

          {status === 'testing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <p className="text-center text-sm text-muted-foreground">
                  Connecting to Caddy...
                </p>
                <Progress value={progress} className="w-full" />
              </div>
            </div>
          )}

          {status === 'success' && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-6">
                <div className="relative">
                  <CheckCircle2 className="w-20 h-20 text-green-500" />
                  <div className="absolute inset-0 w-20 h-20 rounded-full bg-green-500/20 animate-ping" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-green-500 mb-2">
                  Connection successful!
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Successfully connected to the Caddy instance
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card/50 border border-border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className="font-semibold text-green-500">Healthy</p>
                </div>
                <div className="bg-card/50 border border-border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Response Time</p>
                  <p className="font-semibold">{result.latency_ms}ms</p>
                </div>
              </div>

              {result.message && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-500">{result.message}</p>
                </div>
              )}
            </div>
          )}

          {status === 'failure' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-6">
                <XCircle className="w-20 h-20 text-destructive" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-destructive mb-2">
                  Connection failed
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Unable to connect to the Caddy instance
                </p>
              </div>

              {(error || result?.message) && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const detailsEl = document.getElementById('error-details');
                      if (detailsEl) {
                        detailsEl.classList.toggle('hidden');
                      }
                    }}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Show details
                  </Button>
                  <div id="error-details" className="hidden">
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-xs font-mono text-destructive break-all">
                        {error || result?.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-500">
                  <p className="font-semibold mb-1">Troubleshooting tips:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Verify the Admin API URL is correct</li>
                    <li>• Ensure the Caddy instance is running</li>
                    <li>• Check that authentication credentials are valid</li>
                    <li>• Confirm network connectivity and firewall settings</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {status === 'failure' && (
            <Button variant="outline" onClick={handleTest}>
              Retry
            </Button>
          )}
          <Button onClick={handleClose} disabled={status === 'testing'}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
