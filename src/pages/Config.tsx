import { useState } from "react";
import { FileCode, Save, RefreshCw, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const Config = () => {
  const [selectedInstance, setSelectedInstance] = useState("production");
  const [config] = useState(`{
  "apps": {
    "http": {
      "servers": {
        "srv0": {
          "listen": [":443"],
          "routes": [
            {
              "match": [
                {
                  "host": ["example.com"]
                }
              ],
              "handle": [
                {
                  "handler": "reverse_proxy",
                  "upstreams": [
                    {
                      "dial": "localhost:8080"
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    }
  }
}`);

  const [caddyfile] = useState(`example.com {
    reverse_proxy localhost:8080
    
    tls {
        protocols tls1.2 tls1.3
    }
    
    encode gzip
    
    log {
        output file /var/log/caddy/access.log
    }
}`);

  return (
    <div className="min-h-screen bg-gradient-dark p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Configuration</h1>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button className="bg-gradient-primary hover:shadow-glow transition-all">
                <Save className="w-4 h-4 mr-2" />
                Apply Changes
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            View and edit Caddy configurations
          </p>
        </div>

        {/* Instance Selector */}
        <Card className="mb-6 bg-card/50 backdrop-blur border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Instance:</label>
              <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                <SelectTrigger className="w-64 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Editor */}
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileCode className="w-5 h-5" />
                Configuration Editor
              </CardTitle>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="json" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="json">JSON Config</TabsTrigger>
                <TabsTrigger value="caddyfile">Caddyfile</TabsTrigger>
              </TabsList>
              <TabsContent value="json">
                <Textarea
                  className="font-mono text-sm bg-background border-border min-h-[600px]"
                  value={config}
                  readOnly
                />
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Last updated: 5 minutes ago
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Validate
                    </Button>
                    <Button variant="outline" size="sm">
                      Format
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="caddyfile">
                <Textarea
                  className="font-mono text-sm bg-background border-border min-h-[600px]"
                  value={caddyfile}
                  readOnly
                />
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    This will be adapted to JSON before applying
                  </p>
                  <Button variant="outline" size="sm">
                    Adapt to JSON
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                Zero-Downtime Reload
              </h3>
              <p className="text-sm text-muted-foreground">
                Configuration changes are applied gracefully without dropping
                connections. Invalid configs are automatically rejected.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Save className="w-4 h-4" />
                Concurrent Safety
              </h3>
              <p className="text-sm text-muted-foreground">
                Uses ETag/If-Match headers to prevent conflicting changes when
                multiple users edit the same configuration.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Config;
