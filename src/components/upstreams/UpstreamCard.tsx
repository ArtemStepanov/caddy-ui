import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { UpstreamCardProps } from "@/types";
import { Activity, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useDateFormat } from "@/hooks/useDateFormat";

export function UpstreamCard({ upstream, poolName, onViewDetails, onTestHealth }: UpstreamCardProps) {
  const { formatLastSeen, showRelativeTimestamps, formatDateTime } = useDateFormat();
  const status = upstream.status || 'unknown';
  const responseTime = upstream.response_time || 0;
  const maxFails = upstream.health_checks?.passive?.max_fails || 100;
  const failsPercentage = (upstream.fails || 0) / maxFails * 100;

  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          label: 'Healthy',
          animate: true,
        };
      case 'degraded':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          label: 'Degraded',
          animate: false,
        };
      case 'unhealthy':
        return {
          icon: <XCircle className="w-5 h-5" />,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          label: 'Unhealthy',
          animate: false,
        };
      default:
        return {
          icon: <Activity className="w-5 h-5" />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          label: 'Unknown',
          animate: false,
        };
    }
  };

  const getResponseTimeColor = () => {
    if (responseTime < 100) return 'text-green-500';
    if (responseTime < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProtocolBadge = () => {
    const address = upstream.address || upstream.dial || '';
    if (address.startsWith('https://') || address.includes(':443')) return 'HTTPS';
    if (address.startsWith('h2c://')) return 'H2C';
    return 'HTTP';
  };

  const statusConfig = getStatusConfig();

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${statusConfig.borderColor} border-2`}>
      {/* Animated pulse for healthy upstreams */}
      {statusConfig.animate && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent animate-pulse pointer-events-none" />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Status Indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`p-2 rounded-full ${statusConfig.bgColor} ${statusConfig.color} relative`}>
                    {statusConfig.icon}
                    {statusConfig.animate && (
                      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{statusConfig.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* URL */}
            <div className="flex-1 min-w-0">
              <h3 className="font-mono text-sm font-semibold truncate">
                {upstream.address || upstream.dial}
              </h3>
              {poolName && (
                <p className="text-xs text-muted-foreground truncate">
                  Pool: {poolName}
                </p>
              )}
            </div>
          </div>

          {/* Protocol Badge */}
          <Badge variant="secondary" className="text-xs">
            {getProtocolBadge()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Metrics Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Response Time */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Response Time</span>
            </div>
            <p className={`text-lg font-bold ${getResponseTimeColor()}`}>
              {responseTime}ms
            </p>
          </div>

          {/* Requests */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="w-3 h-3" />
              <span>Requests</span>
            </div>
            <p className="text-lg font-bold">
              {(upstream.num_requests || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Fails Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Fails</span>
            <span className={failsPercentage > 50 ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
              {upstream.fails || 0} / {maxFails}
            </span>
          </div>
          <Progress 
            value={failsPercentage} 
            className={`h-1.5 ${failsPercentage > 50 ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`}
          />
        </div>

        {/* Last Check */}
        {upstream.last_check && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>Last Check</span>
            <span className="font-medium">
              {showRelativeTimestamps ? formatLastSeen(upstream.last_check) : formatDateTime(upstream.last_check)}
            </span>
          </div>
        )}

        {/* Status Duration - Note: Caddy API doesn't provide uptime history */}
        {upstream.healthy !== undefined && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-muted-foreground">Status</span>
            <span className={`font-medium ${
              upstream.healthy ? 'text-green-500' : 'text-red-500'
            }`}>
              {upstream.healthy ? 'Operational' : 'Down'}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onTestHealth(upstream);
          }}
        >
          Test Now
        </Button>
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(upstream);
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
