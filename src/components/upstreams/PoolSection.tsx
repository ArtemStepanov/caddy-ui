import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { UpstreamPool, Upstream } from "@/types/api";
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, Clock, MoreVertical } from "lucide-react";
import { useState } from "react";
import { UpstreamCard } from "./UpstreamCard";

interface PoolSectionProps {
  pool: UpstreamPool;
  onViewDetails: (upstream: Upstream) => void;
  onTestHealth: (upstream?: Upstream) => void;
  defaultOpen?: boolean;
}

export function PoolSection({ pool, onViewDetails, onTestHealth, defaultOpen = true }: PoolSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getPoolStatus = () => {
    if (pool.unhealthy_count === pool.total_upstreams) return 'critical';
    if (pool.unhealthy_count && pool.unhealthy_count > 0) return 'warning';
    return 'healthy';
  };

  const poolStatus = getPoolStatus();

  const statusConfig = {
    healthy: {
      color: 'bg-green-500',
      textColor: 'text-green-500',
      icon: <CheckCircle className="w-4 h-4" />,
    },
    warning: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500',
      icon: <AlertCircle className="w-4 h-4" />,
    },
    critical: {
      color: 'bg-red-500',
      textColor: 'text-red-500',
      icon: <AlertCircle className="w-4 h-4" />,
    },
  };

  const config = statusConfig[poolStatus];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 flex-1 justify-start p-0 h-auto hover:bg-transparent">
              {/* Expand/Collapse Icon */}
              {isOpen ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}

              {/* Status Indicator */}
              <div className={`w-3 h-3 rounded-full ${config.color} ${poolStatus === 'healthy' ? 'animate-pulse' : ''}`} />

              {/* Pool Name */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold truncate">
                  {pool.name || `Pool #${pool.id}`}
                </h3>
                {pool.lb_policy && (
                  <p className="text-xs text-muted-foreground">
                    Load Balancer: {pool.lb_policy}
                  </p>
                )}
              </div>
            </Button>
          </CollapsibleTrigger>

          {/* Mini Stats */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">{pool.total_upstreams} upstreams</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-medium">{pool.healthy_count}</span>
              </div>

              {pool.unhealthy_count ? (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-500 font-medium">{pool.unhealthy_count}</span>
                </div>
              ) : null}

              {pool.avg_response_time !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{Math.round(pool.avg_response_time)}ms</span>
                </div>
              )}
            </div>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onTestHealth()}>
                  Health Check All
                </DropdownMenuItem>
                <DropdownMenuItem>View Configuration</DropdownMenuItem>
                <DropdownMenuItem>Copy Pool Config</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="sm:hidden mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {pool.total_upstreams} upstreams
          </Badge>
          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
            {pool.healthy_count} healthy
          </Badge>
          {pool.unhealthy_count ? (
            <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-500">
              {pool.unhealthy_count} unhealthy
            </Badge>
          ) : null}
          {pool.avg_response_time !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {Math.round(pool.avg_response_time)}ms avg
            </Badge>
          )}
        </div>
      </div>

      <CollapsibleContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {pool.upstreams.map((upstream, idx) => (
            <UpstreamCard
              key={`${upstream.address}-${idx}`}
              upstream={upstream}
              poolName={pool.name}
              onViewDetails={onViewDetails}
              onTestHealth={onTestHealth}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
