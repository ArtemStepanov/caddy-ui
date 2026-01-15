import { Server, Activity, Shield, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/StatsCard";
import { InstanceCard } from "@/components/InstanceCard";
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
import { useInstances } from "@/hooks/useInstances";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

const Dashboard = () => {
  const navigate = useNavigate();
  const { instances, loading, fetchInstances } = useInstances();
  
  // Auto-refresh based on settings
  useAutoRefresh({
    onRefresh: fetchInstances,
    enabled: true,
  });
  
  // Calculate stats from real data
  // Backend returns 'online'/'offline'/'unknown'/'error' status values
  const healthyCount = instances.filter(i => i.status === 'online').length;
  const stats = [
    { title: "Total Instances", value: instances.length, icon: Server, trend: { value: 12, positive: true } },
    { title: "Healthy Instances", value: healthyCount, icon: Activity, trend: { value: 8, positive: true } },
    { title: "Certificates", value: 0, icon: Shield, trend: { value: 3, positive: true } },
    { title: "Uptime", value: "99.9%", icon: TrendingUp, trend: { value: 5, positive: true } },
  ];

  // Convert instances to dashboard format
  // Backend status 'online' maps to UI status 'online', all others are 'offline'
  const dashboardInstances = instances.slice(0, 6).map(instance => ({
    name: instance.name,
    url: instance.admin_url,
    status: instance.status === 'online' ? 'online' as const : 'offline' as const,
    upstreams: 0,
  }));

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Monitor and manage your Caddy instances
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Instances Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Instances</h2>
          {loading ? (
            <div className="text-muted-foreground">Loading instances...</div>
          ) : dashboardInstances.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {dashboardInstances.map((instance) => (
                <InstanceCard key={instance.name} {...instance} />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">No instances available</div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-start"
              onClick={() => navigate("/config")}
            >
              <span className="font-semibold mb-1">View Configurations</span>
              <span className="text-xs text-muted-foreground">
                Manage Caddy configs across instances
              </span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-start"
              onClick={() => navigate("/upstreams")}
            >
              <span className="font-semibold mb-1">Monitor Upstreams</span>
              <span className="text-xs text-muted-foreground">
                Check health and status of backends
              </span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-start"
              onClick={() => navigate("/certificates")}
            >
              <span className="font-semibold mb-1">Manage Certificates</span>
              <span className="text-xs text-muted-foreground">
                View and renew SSL/TLS certificates
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
