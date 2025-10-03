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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInstances } from "@/hooks/useInstances";

const Instances = () => {
  const { instances, loading, createInstance, deleteInstance, testConnection } = useInstances();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    admin_url: "",
    auth_type: "none" as "none" | "bearer" | "mtls",
    token: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const credentials = formData.auth_type === "bearer" && formData.token 
      ? { token: formData.token }
      : {};
    
    await createInstance({
      name: formData.name,
      admin_url: formData.admin_url,
      auth_type: formData.auth_type,
      credentials,
    });
    
    setDialogOpen(false);
    setFormData({ name: "", admin_url: "", auth_type: "none", token: "" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this instance?")) {
      await deleteInstance(id);
    }
  };

  const handleTestConnection = async (id: string) => {
    await testConnection(id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500/20 text-green-500 border-green-500/50";
      case "offline":
        return "bg-red-500/20 text-red-500 border-red-500/50";
      case "error":
        return "bg-orange-500/20 text-orange-500 border-orange-500/50";
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/50";
    }
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return "Never";
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

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
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Instance Name</Label>
                    <Input
                      id="name"
                      placeholder="Production Server"
                      className="bg-background border-border"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">Admin API URL</Label>
                    <Input
                      id="url"
                      placeholder="http://localhost:2019"
                      className="bg-background border-border"
                      value={formData.admin_url}
                      onChange={(e) => setFormData({ ...formData, admin_url: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auth_type">Authentication Type</Label>
                    <Select
                      value={formData.auth_type}
                      onValueChange={(value: "none" | "bearer" | "mtls") => 
                        setFormData({ ...formData, auth_type: value })
                      }
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="mtls">mTLS (Manual)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.auth_type === "bearer" && (
                    <div className="space-y-2">
                      <Label htmlFor="token">Bearer Token</Label>
                      <Input
                        id="token"
                        type="password"
                        placeholder="Your API token"
                        className="bg-background border-border"
                        value={formData.token}
                        onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                      />
                    </div>
                  )}
                  <Button type="submit" className="w-full bg-gradient-primary">
                    Connect Instance
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-muted-foreground">
            Manage your connected Caddy server instances
          </p>
        </div>

        {/* Instances List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : instances.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="py-12 text-center">
              <Server className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No instances yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first Caddy instance to get started
              </p>
            </CardContent>
          </Card>
        ) : (
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
                          {instance.admin_url}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getStatusColor(instance.status)}
                      >
                        {instance.status}
                      </Badge>
                      <Badge variant="secondary">{instance.auth_type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Last seen: {formatLastSeen(instance.last_seen)}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleTestConnection(instance.id)}
                        title="Test connection"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" title="Settings">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDelete(instance.id)}
                        title="Delete instance"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
