import { Shield, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDateFormat } from "@/hooks/useDateFormat";

const Certificates = () => {
  const { formatDate } = useDateFormat();
  const certificates = [
    {
      id: "1",
      domain: "example.com",
      issuer: "Let's Encrypt",
      expires: "2025-06-15",
      daysLeft: 72,
      status: "valid",
      autoRenew: true,
    },
    {
      id: "2",
      domain: "api.example.com",
      issuer: "Let's Encrypt",
      expires: "2025-05-20",
      daysLeft: 46,
      status: "valid",
      autoRenew: true,
    },
    {
      id: "3",
      domain: "staging.example.com",
      issuer: "Let's Encrypt",
      expires: "2025-04-10",
      daysLeft: 6,
      status: "expiring",
      autoRenew: true,
    },
    {
      id: "4",
      domain: "old.example.com",
      issuer: "Self-Signed",
      expires: "2025-04-01",
      daysLeft: -3,
      status: "expired",
      autoRenew: false,
    },
  ];

  const getStatusBadge = (status: string) => {
    const config = {
      valid: { color: "bg-success", text: "Valid" },
      expiring: { color: "bg-warning", text: "Expiring Soon" },
      expired: { color: "bg-destructive", text: "Expired" },
    };
    return config[status as keyof typeof config] || { color: "bg-muted", text: "Unknown" };
  };

  return (
    <div className="min-h-screen bg-gradient-dark p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Certificates</h1>
            <Button className="bg-gradient-primary hover:shadow-glow transition-all">
              <Shield className="w-4 h-4 mr-2" />
              Generate Certificate
            </Button>
          </div>
          <p className="text-muted-foreground">
            Manage SSL/TLS certificates and PKI
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="text-3xl font-bold">4</p>
                </div>
                <Shield className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Valid</p>
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
                  <p className="text-sm text-muted-foreground mb-1">Expiring</p>
                  <p className="text-3xl font-bold text-warning">1</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Auto-Renew</p>
                  <p className="text-3xl font-bold text-accent">3</p>
                </div>
                <Calendar className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificates Table */}
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              SSL/TLS Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Issuer</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auto-Renew</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((cert) => {
                  const statusConfig = getStatusBadge(cert.status);
                  return (
                    <TableRow key={cert.id}>
                      <TableCell className="font-mono font-medium">
                        {cert.domain}
                      </TableCell>
                      <TableCell>{cert.issuer}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatDate(cert.expires)}</span>
                          <span className="text-xs text-muted-foreground">
                            {cert.daysLeft > 0
                              ? `${cert.daysLeft} days left`
                              : `Expired ${Math.abs(cert.daysLeft)} days ago`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${statusConfig.color} border-0`}
                        >
                          {statusConfig.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {cert.autoRenew ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            Renew
                          </Button>
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-accent/5 border-accent/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Automatic HTTPS
            </h3>
            <p className="text-sm text-muted-foreground">
              Caddy automatically obtains and renews certificates from Let's Encrypt.
              Certificates are renewed when they have less than 30 days remaining.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Certificates;
