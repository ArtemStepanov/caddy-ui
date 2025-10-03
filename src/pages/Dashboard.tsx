import { Server, Activity, Shield, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { InstanceCard } from "@/components/InstanceCard";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  // Mock data - в реальном приложении будет из API
  const stats = [
    { title: "Total Instances", value: 3, icon: Server, trend: { value: 12, positive: true } },
    { title: "Active Upstreams", value: 24, icon: Activity, trend: { value: 8, positive: true } },
    { title: "Certificates", value: 15, icon: Shield, trend: { value: 3, positive: true } },
    { title: "Requests/min", value: "12.5K", icon: TrendingUp, trend: { value: 5, positive: false } },
  ];

  const instances = [
    { name: "Production", url: "https://api.example.com:2019", status: "online" as const, upstreams: 12 },
    { name: "Staging", url: "https://staging.example.com:2019", status: "online" as const, upstreams: 8 },
    { name: "Development", url: "http://localhost:2019", status: "offline" as const, upstreams: 4 },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <Button className="bg-gradient-primary hover:shadow-glow transition-all">
              Add Instance
            </Button>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {instances.map((instance) => (
              <InstanceCard key={instance.name} {...instance} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-start">
              <span className="font-semibold mb-1">View Configurations</span>
              <span className="text-xs text-muted-foreground">
                Manage Caddy configs across instances
              </span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-start">
              <span className="font-semibold mb-1">Monitor Upstreams</span>
              <span className="text-xs text-muted-foreground">
                Check health and status of backends
              </span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-start">
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
