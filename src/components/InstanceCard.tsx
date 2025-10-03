import { Server, Activity, AlertCircle, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const navigate = useNavigate();
  
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
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <Server className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg truncate">{name}</CardTitle>
              <p className="text-sm text-muted-foreground truncate">{url}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`${config.color} border-0 text-foreground whitespace-nowrap flex-shrink-0`}
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
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => navigate("/config")}
          >
            Manage
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <SettingsIcon className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Instance Settings</DialogTitle>
                <DialogDescription>
                  Configure settings for {name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Instance Name</Label>
                  <Input
                    id="edit-name"
                    defaultValue={name}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-url">Admin API URL</Label>
                  <Input
                    id="edit-url"
                    defaultValue={url}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-auth">Authentication</Label>
                  <Input
                    id="edit-auth"
                    type="password"
                    placeholder="API Key or Bearer Token"
                    className="bg-background border-border"
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-gradient-primary">
                    Save Changes
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    Delete Instance
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
