import { Server, MoreVertical, Settings, Trash2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InstanceGridCardProps } from "@/types";
import { getStatusConfig, mapInstanceStatus } from "@/lib/instance-utils";
import { cn } from "@/lib/utils";
import { useDateFormat } from "@/hooks/useDateFormat";

export function InstanceGridCard({ instance, onEdit, onDelete, onTest }: InstanceGridCardProps) {
  const status = mapInstanceStatus(instance.status);
  const statusConfig = getStatusConfig(status);
  const { formatLastSeen } = useDateFormat();

  return (
    <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all hover:shadow-lg group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Status Indicator with Pulse */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Server className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1">
                <div className="relative">
                  <div className={cn("w-3 h-3 rounded-full", statusConfig.dotColor)} />
                  {statusConfig.pulse && (
                    <div className={cn(
                      "absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75",
                      statusConfig.dotColor
                    )} />
                  )}
                </div>
              </div>
            </div>

            {/* Instance Info */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg truncate">{instance.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {instance.admin_url}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onClick={() => onEdit(instance)}>
                <Settings className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTest(instance)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Health Check
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(instance)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("flex-1 justify-center", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
          <Badge variant="secondary" className="flex-1 justify-center">
            {instance.auth_type}
          </Badge>
        </div>

        {/* Last Seen */}
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Last seen:</span>{' '}
          {formatLastSeen(instance.last_seen)}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onTest(instance)}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Test
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(instance)}
          >
            <Settings className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
