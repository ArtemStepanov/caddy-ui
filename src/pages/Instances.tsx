import { useState } from "react";
import { Plus, Server, Trash2, Settings, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const Instances = () => {
  const [instances] = useState([
    {
      id: "1",
      name: "Production",
      url: "https://api.example.com:2019",
      status: "online",
      version: "2.7.6",
      lastSync: "2 minutes ago",
    },
    {
      id: "2",
      name: "Staging",
      url: "https://staging.example.com:2019",
      status: "online",
      version: "2.7.6",
      lastSync: "5 minutes ago",
    },
    {
      id: "3",
      name: "Development",
      url: "http://localhost:2019",
      status: "offline",
      version: "2.7.5",
      lastSync: "1 hour ago",
    },
  ]);

  return (
    <div className="min-h-screen bg-gradient-dark p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Instances</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:shadow-glow transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Instance
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Add New Instance</DialogTitle>
                  <DialogDescription>
                    Connect a new Caddy instance to manage remotely
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Instance Name</Label>
                    <Input
                      id="name"
                      placeholder="Production Server"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">Admin API URL</Label>
                    <Input
                      id="url"
                      placeholder="https://your-server:2019"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auth">Authentication (Optional)</Label>
                    <Input
                      id="auth"
                      type="password"
                      placeholder="API Key or Bearer Token"
                      className="bg-background border-border"
                    />
                  </div>
                  <Button className="w-full bg-gradient-primary">
                    Connect Instance
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-muted-foreground">
            Manage your connected Caddy server instances
          </p>
        </div>

        {/* Instances List */}
        <div className="space-y-4">
          {instances.map((instance) => (
            <Card
              key={instance.id}
              className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Server className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{instance.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {instance.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`${
                        instance.status === "online"
                          ? "bg-success"
                          : "bg-muted-foreground"
                      } border-0`}
                    >
                      {instance.status}
                    </Badge>
                    <Badge variant="secondary">v{instance.version}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Last sync: {instance.lastSync}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Remote Admin API</h3>
            <p className="text-sm text-muted-foreground">
              To connect remote instances, ensure the Caddy Admin API is
              accessible and properly secured with mTLS or authentication. By
              default, Admin API listens on localhost:2019.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Instances;
