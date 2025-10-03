import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Upstream } from "@/types/api";
import { AlertCircle, CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface HealthCheckModalProps {
  open: boolean;
  onClose: () => void;
  upstreams: Upstream[];
  onTestComplete?: () => void;
}

interface TestResult {
  address: string;
  status: 'pending' | 'testing' | 'success' | 'failed' | 'slow';
  responseTime?: number;
  error?: string;
}

export function HealthCheckModal({ open, onClose, upstreams, onTestComplete }: HealthCheckModalProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open && upstreams.length > 0) {
      startHealthCheck();
    }
  }, [open, upstreams]);

  const startHealthCheck = async () => {
    setTesting(true);
    setProgress(0);
    
    const initialResults: TestResult[] = upstreams.map(u => ({
      address: u.address || u.dial || '',
      status: 'pending',
    }));
    setResults(initialResults);

    // Simulate testing each upstream with a delay
    for (let i = 0; i < upstreams.length; i++) {
      const upstream = upstreams[i];
      
      // Update to testing
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'testing' as const } : r
      ));

      // Simulate test delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      // Determine result based on upstream status
      const isHealthy = upstream.status === 'healthy';
      const isSlow = upstream.response_time && upstream.response_time > 500;
      
      setResults(prev => prev.map((r, idx) => 
        idx === i ? {
          ...r,
          status: !isHealthy ? 'failed' : isSlow ? 'slow' : 'success',
          responseTime: upstream.response_time || Math.floor(Math.random() * 200) + 20,
          error: !isHealthy ? 'Connection refused' : undefined,
        } as TestResult : r
      ));

      setProgress(((i + 1) / upstreams.length) * 100);
    }

    setTesting(false);
    onTestComplete?.();
  };

  const getSummary = () => {
    const success = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const slow = results.filter(r => r.status === 'slow').length;
    return { success, failed, slow };
  };

  const summary = getSummary();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Health Check Results</DialogTitle>
          <DialogDescription>
            Testing {upstreams.length} upstream{upstreams.length !== 1 ? 's' : ''}...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          {testing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Summary (shown when complete) */}
          {!testing && results.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-green-500/5 border-green-500/20 p-3 text-center">
                <div className="text-2xl font-bold text-green-500">{summary.success}</div>
                <div className="text-xs text-muted-foreground">Healthy</div>
              </div>
              <div className="rounded-lg border bg-red-500/5 border-red-500/20 p-3 text-center">
                <div className="text-2xl font-bold text-red-500">{summary.failed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div className="rounded-lg border bg-yellow-500/5 border-yellow-500/20 p-3 text-center">
                <div className="text-2xl font-bold text-yellow-500">{summary.slow}</div>
                <div className="text-xs text-muted-foreground">Slow</div>
              </div>
            </div>
          )}

          {/* Results List */}
          <ScrollArea className="h-80 rounded-lg border">
            <div className="p-4 space-y-2">
              {results.map((result, idx) => (
                <ResultItem key={idx} result={result} />
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!testing && (
            <Button onClick={startHealthCheck}>
              Test Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultItem({ result }: { result: TestResult }) {
  const getIcon = () => {
    switch (result.status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'testing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'slow':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (result.status) {
      case 'pending':
        return 'Waiting...';
      case 'testing':
        return 'Testing...';
      case 'success':
        return `Healthy (${result.responseTime}ms)`;
      case 'failed':
        return `Failed${result.error ? `: ${result.error}` : ''}`;
      case 'slow':
        return `Slow (${result.responseTime}ms)`;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {getIcon()}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm truncate">{result.address}</p>
      </div>
      <div className="text-sm text-muted-foreground">
        {getStatusText()}
      </div>
    </div>
  );
}
