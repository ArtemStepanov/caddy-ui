import { Server, Activity, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InstanceCardProps {
  name: string;
  url: string;
  status: "online" | "offline" | "error";
  version?: string;
  upstreams?: number;
}

export function InstanceCard({
  name,
  url,
  status,
  version = "2.7.6",
  upstreams = 0,
}: InstanceCardProps) {
  const statusConfig = {
    online: { color: "bg-success", text: "Online", icon: Activity },
    offline: { color: "bg-muted-foreground", text: "Offline", icon: Server },
    error: { color: "bg-destructive", text: "Error", icon: AlertCircle },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all hover:shadow-glow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Server className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <p className="text-sm text-muted-foreground">{url}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`${config.color} border-0 text-foreground`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {config.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Version:</span>{" "}
            <span className="text-foreground">{version}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Upstreams:</span>{" "}
            <span className="text-foreground">{upstreams}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            Manage
          </Button>
          <Button variant="ghost" size="sm">
            Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
