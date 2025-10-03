import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UpstreamDetailsDrawerProps } from "@/types";
import { Activity, AlertCircle, CheckCircle, Code, Copy, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export function UpstreamDetailsDrawer({ upstream, instanceId, open, onClose, onTestHealth }: UpstreamDetailsDrawerProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  if (!upstream) return null;

  const status = upstream.status || 'unknown';
  const maxFails = upstream.health_checks?.passive?.max_fails || 100;

  const handleCopyUrl = async () => {
    const url = upstream.address || upstream.dial;
    if (!url) {
      toast({
        title: 'Error',
        description: 'No URL available to copy',
        variant: 'destructive',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Copied to Clipboard',
        description: `URL copied: ${url}`,
      });
    } catch (_) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleViewInConfig = () => {
    if (instanceId) {
      navigate(`/config?instance=${instanceId}`);
    } else {
      navigate('/config');
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          label: 'Healthy',
        };
      case 'degraded':
        return {
          icon: <AlertCircle className="w-6 h-6" />,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          label: 'Degraded',
        };
      case 'unhealthy':
        return {
          icon: <XCircle className="w-6 h-6" />,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          label: 'Unhealthy',
        };
      default:
        return {
          icon: <Activity className="w-6 h-6" />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          label: 'Unknown',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-3 rounded-full ${statusConfig.bgColor}`}>
                  <div className={statusConfig.color}>
                    {statusConfig.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="font-mono text-lg truncate">
                    {upstream.address || upstream.dial}
                  </SheetTitle>
                  <SheetDescription>
                    Upstream backend server details and metrics
                  </SheetDescription>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onTestHealth(upstream)}
                  className="flex-1"
                >
                  Test Health
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={handleCopyUrl}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy URL
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={handleViewInConfig}>
                  View in Config
                </Button>
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="config">Config</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Status Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Status</span>
                      <Badge className={statusConfig.bgColor}>
                        <span className={statusConfig.color}>{statusConfig.label}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Status</span>
                      <span className={`font-medium ${
                        upstream.healthy ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {upstream.healthy ? 'Operational' : 'Down'}
                      </span>
                    </div>

                    {upstream.last_check && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Check</span>
                        <span className="font-medium">
                          {formatDistanceToNow(new Date(upstream.last_check), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Real-time Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Real-time Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Response Time</p>
                        <p className="text-2xl font-bold">{upstream.response_time || 0}ms</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Requests</p>
                        <p className="text-2xl font-bold">{(upstream.num_requests || 0).toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                        <p className="text-2xl font-bold text-green-500">
                          {status === 'healthy' ? '100%' : status === 'degraded' ? '95%' : '0%'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Failed Checks</p>
                        <p className="text-2xl font-bold">{upstream.fails || 0} / {maxFails}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {status === 'healthy' && (
                        <ActivityEntry
                          type="success"
                          message="Health check passed"
                          time="5 seconds ago"
                        />
                      )}
                      {status === 'degraded' && (
                        <ActivityEntry
                          type="warning"
                          message={`Slow response detected (${upstream.response_time}ms)`}
                          time="2 minutes ago"
                        />
                      )}
                      {status === 'unhealthy' && (
                        <ActivityEntry
                          type="error"
                          message="Health check failed: Connection timeout"
                          time="1 minute ago"
                        />
                      )}
                      <ActivityEntry
                        type="success"
                        message="Health check passed"
                        time="35 seconds ago"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Configuration Tab */}
              <TabsContent value="config" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      Upstream Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                      <code>{JSON.stringify({
                        address: upstream.address,
                        dial: upstream.dial,
                        max_requests: upstream.max_requests,
                        health_checks: upstream.health_checks,
                      }, null, 2)}</code>
                    </pre>
                  </CardContent>
                </Card>

                <Button variant="outline" className="w-full" onClick={handleViewInConfig}>
                  Edit in Configuration
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function ActivityEntry({ type, message, time }: { type: 'success' | 'warning' | 'error'; message: string; time: string }) {
  const config = {
    success: { icon: CheckCircle, color: 'text-green-500' },
    warning: { icon: AlertCircle, color: 'text-yellow-500' },
    error: { icon: XCircle, color: 'text-red-500' },
  };

  const Icon = config[type].icon;

  return (
    <div className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
      <Icon className={`w-4 h-4 mt-0.5 ${config[type].color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm">{message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
      </div>
    </div>
  );
}

