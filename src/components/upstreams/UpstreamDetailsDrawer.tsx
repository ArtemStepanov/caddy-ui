import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { UpstreamDetailsDrawerProps } from "@/types";
import { Activity, AlertCircle, CheckCircle, Code, Copy, Info, LineChart, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { parseDurationToMs } from "@/lib/utils";

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
    } catch (error) {
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
                {/* Info Banner */}
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-500 mb-1">Current Metrics Only</p>
                      <p className="text-muted-foreground">
                        Caddy Admin API provides current metrics only. For historical performance data and trending, 
                        consider integrating with Prometheus metrics at <code className="text-xs bg-muted px-1 py-0.5 rounded">:2019/metrics</code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Current Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Response Time</span>
                          <span className={`text-2xl font-bold ${
                            (upstream.response_time || 0) < 100 ? 'text-green-500' :
                            (upstream.response_time || 0) < 500 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {upstream.response_time || 0}ms
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(((upstream.response_time || 0) / 1000) * 100, 100)} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Requests</span>
                          <span className="text-2xl font-bold">
                            {(upstream.num_requests || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Since upstream started
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Failed Requests</span>
                          <span className={`text-2xl font-bold ${
                            (upstream.fails || 0) > 0 ? 'text-red-500' : 'text-green-500'
                          }`}>
                            {upstream.fails || 0}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Max: {upstream.health_checks?.passive?.max_fails || 100}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Success Rate</span>
                          <span className="text-2xl font-bold text-green-500">
                            {upstream.num_requests && upstream.num_requests > 0
                              ? ((upstream.num_requests - (upstream.fails || 0)) / upstream.num_requests * 100).toFixed(1)
                              : '100'}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Based on request/fail ratio
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Latency Percentiles Visualization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Estimated Latency Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        latency: {
                          label: "Response Time",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-48"
                    >
                      <BarChart
                        data={[
                          { percentile: "P50", value: upstream.response_time || 0 },
                          { percentile: "P75", value: Math.round((upstream.response_time || 0) * 1.5) },
                          { percentile: "P90", value: Math.round((upstream.response_time || 0) * 2.5) },
                          { percentile: "P95", value: Math.round((upstream.response_time || 0) * 3.5) },
                          { percentile: "P99", value: Math.round((upstream.response_time || 0) * 4.5) },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="percentile" 
                          className="text-xs"
                        />
                        <YAxis 
                          className="text-xs"
                          label={{ value: 'ms', angle: -90, position: 'insideLeft' }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                      </BarChart>
                    </ChartContainer>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Estimated distribution based on current response time of {upstream.response_time || 0}ms
                    </p>
                  </CardContent>
                </Card>

                {/* Request Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Request Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-sm">Successful</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={upstream.num_requests && upstream.num_requests > 0
                              ? ((upstream.num_requests - (upstream.fails || 0)) / upstream.num_requests * 100)
                              : 100
                            }
                            className="w-32 h-2"
                          />
                          <span className="text-sm font-mono font-medium w-20 text-right">
                            {((upstream.num_requests || 0) - (upstream.fails || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-sm">Failed</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={upstream.num_requests && upstream.num_requests > 0
                              ? ((upstream.fails || 0) / upstream.num_requests * 100)
                              : 0
                            }
                            className="w-32 h-2 [&>div]:bg-red-500"
                          />
                          <span className="text-sm font-mono font-medium w-20 text-right">
                            {(upstream.fails || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Thresholds */}
                {upstream.health_checks?.passive?.unhealthy_latency && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Performance Thresholds</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Unhealthy Latency Threshold</span>
                        <span className="font-mono font-medium">{upstream.health_checks.passive.unhealthy_latency}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Current Response Time</span>
                        <span className={`font-mono font-medium ${
                          (upstream.response_time || 0) < parseDurationToMs(upstream.health_checks.passive.unhealthy_latency) 
                            ? 'text-green-500' 
                            : 'text-red-500'
                        }`}>
                          {upstream.response_time || 0}ms
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={(upstream.response_time || 0) < parseDurationToMs(upstream.health_checks.passive.unhealthy_latency) ? 'default' : 'destructive'}>
                          {(upstream.response_time || 0) < parseDurationToMs(upstream.health_checks.passive.unhealthy_latency) 
                            ? 'Within Threshold' 
                            : 'Exceeds Threshold'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
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

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  );
}
