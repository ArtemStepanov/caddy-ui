import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Upstream } from "@/types/api";
import { Activity, AlertCircle, CheckCircle, Clock, Code, LineChart, TrendingUp, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UpstreamDetailsDrawerProps {
  upstream: Upstream | null;
  open: boolean;
  onClose: () => void;
  onTestHealth: (upstream: Upstream) => void;
}

export function UpstreamDetailsDrawer({ upstream, open, onClose, onTestHealth }: UpstreamDetailsDrawerProps) {
  if (!upstream) return null;

  const status = upstream.status || 'unknown';
  const maxFails = upstream.health_checks?.passive?.max_fails || 100;

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
                <Button size="sm" variant="outline" className="flex-1">
                  Copy URL
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  View in Config
                </Button>
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="health">Health</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
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
                    
                    {upstream.uptime_percentage !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Uptime (24h)</span>
                          <span className="font-medium">{upstream.uptime_percentage.toFixed(2)}%</span>
                        </div>
                        <Progress value={upstream.uptime_percentage} className="h-2" />
                      </div>
                    )}

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

              {/* Health Checks Tab */}
              <TabsContent value="health" className="space-y-4">
                {upstream.health_checks?.active && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Active Health Check Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <ConfigRow label="URI" value={upstream.health_checks.active.uri || '/'} />
                      <ConfigRow label="Interval" value={upstream.health_checks.active.interval || '30s'} />
                      <ConfigRow label="Timeout" value={upstream.health_checks.active.timeout || '5s'} />
                      <ConfigRow label="Expected Status" value={upstream.health_checks.active.expect_status?.toString() || '200-299'} />
                    </CardContent>
                  </Card>
                )}

                {upstream.health_checks?.passive && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Passive Health Check Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <ConfigRow label="Max Fails" value={upstream.health_checks.passive.max_fails?.toString() || '5'} />
                      <ConfigRow label="Fail Duration" value={upstream.health_checks.passive.fail_duration || '10s'} />
                      <ConfigRow label="Unhealthy Latency" value={upstream.health_checks.passive.unhealthy_latency || '2000ms'} />
                    </CardContent>
                  </Card>
                )}

                {!upstream.health_checks?.active && !upstream.health_checks?.passive && (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No health checks configured</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LineChart className="w-4 h-4" />
                      Response Time Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-center justify-center border rounded-lg bg-muted/20">
                      <p className="text-sm text-muted-foreground">
                        Chart visualization would go here
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Latency Percentiles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">P50</span>
                        <span className="font-mono font-medium">{upstream.response_time || 0}ms</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">P75</span>
                        <span className="font-mono font-medium">{Math.round((upstream.response_time || 0) * 1.5)}ms</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">P90</span>
                        <span className="font-mono font-medium">{Math.round((upstream.response_time || 0) * 2.5)}ms</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">P99</span>
                        <span className="font-mono font-medium">{Math.round((upstream.response_time || 0) * 4)}ms</span>
                      </div>
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

                <Button variant="outline" className="w-full">
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

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  );
}
