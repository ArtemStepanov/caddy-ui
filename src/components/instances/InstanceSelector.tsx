import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { InstanceSelectorProps } from '@/types';
import { RefreshCw } from 'lucide-react';

export function InstanceSelector({
  instances,
  selectedInstanceId,
  onInstanceChange,
  loading = false,
  showRefreshButton = false,
  onRefresh,
  refreshing = false,
  lastUpdated,
  showStatusBadge = false,
  label = 'Select Instance:',
  className = '',
}: InstanceSelectorProps) {
  const selectedInstance = instances.find((i) => i.id === selectedInstanceId);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatLastUpdated = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card className={`bg-card/50 backdrop-blur border-border ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium whitespace-nowrap">
            {label}
          </label>
          
          <Select
            value={selectedInstanceId || ''}
            onValueChange={onInstanceChange}
            disabled={loading || instances.length === 0}
          >
            <SelectTrigger className="flex-1 max-w-md bg-background border-border">
              <SelectValue
                placeholder={
                  loading
                    ? 'Loading instances...'
                    : instances.length === 0
                    ? 'No instances available'
                    : 'Select a Caddy instance'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {instances.map((instance) => (
                <SelectItem key={instance.id} value={instance.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(instance.status)}`} />
                    {instance.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedInstance && showStatusBadge && (
            <Badge variant={selectedInstance.status === 'online' ? 'default' : 'secondary'}>
              {selectedInstance.status}
            </Badge>
          )}

          {showRefreshButton && onRefresh && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onRefresh}
                    disabled={refreshing || loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Last synced: {formatLastUpdated(lastUpdated)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

