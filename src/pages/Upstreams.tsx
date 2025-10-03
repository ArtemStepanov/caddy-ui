import { Activity, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Upstreams = () => {
  const upstreams = [
    {
      id: "1",
      address: "localhost:8080",
      status: "healthy",
      requests: 1245,
      latency: "45ms",
      uptime: 99.9,
    },
    {
      id: "2",
      address: "localhost:8081",
      status: "healthy",
      requests: 1102,
      latency: "52ms",
      uptime: 99.8,
    },
    {
      id: "3",
      address: "localhost:8082",
      status: "degraded",
      requests: 892,
      latency: "156ms",
      uptime: 98.2,
    },
    {
      id: "4",
      address: "localhost:8083",
      status: "unhealthy",
      requests: 0,
      latency: "N/A",
      uptime: 0,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "degraded":
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case "unhealthy":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      healthy: "bg-success",
      degraded: "bg-warning",
      unhealthy: "bg-destructive",
    };
    return config[status as keyof typeof config] || "bg-muted";
  };

  return (
    <div className="min-h-screen bg-gradient-dark p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Upstreams</h1>
          <p className="text-muted-foreground">
            Monitor health and performance of backend servers
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Upstreams</p>
                  <p className="text-3xl font-bold">4</p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Healthy</p>
                  <p className="text-3xl font-bold text-success">2</p>
                </div>
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Degraded</p>
                  <p className="text-3xl font-bold text-warning">1</p>
                </div>
                <AlertCircle className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Unhealthy</p>
                  <p className="text-3xl font-bold text-destructive">1</p>
                </div>
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upstreams Table */}
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Backend Servers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Uptime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upstreams.map((upstream) => (
                  <TableRow key={upstream.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(upstream.status)}
                        <Badge
                          variant="outline"
                          className={`${getStatusBadge(upstream.status)} border-0 capitalize`}
                        >
                          {upstream.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{upstream.address}</TableCell>
                    <TableCell>{upstream.requests.toLocaleString()}</TableCell>
                    <TableCell>{upstream.latency}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={upstream.uptime} className="w-20" />
                        <span className="text-sm">{upstream.uptime}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upstreams;
