import { Settings as SettingsIcon, Bell, Shield, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  return (
    <div className="min-h-screen bg-gradient-dark p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Configure your Caddy UI preferences
          </p>
        </div>

        {/* General Settings */}
        <Card className="mb-6 bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              General
            </CardTitle>
            <CardDescription>
              Manage your general application settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="refresh">Auto-refresh interval (seconds)</Label>
              <Input
                id="refresh"
                type="number"
                defaultValue={30}
                className="bg-background border-border max-w-xs"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show instance health in sidebar</Label>
                <p className="text-sm text-muted-foreground">
                  Display status indicators next to instance names
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact view</Label>
                <p className="text-sm text-muted-foreground">
                  Use a more condensed layout for tables
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-6 bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Instance offline alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when an instance goes offline
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Certificate expiration warnings</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when certificates are expiring soon
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Configuration change notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Notify on successful config updates
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="mb-6 bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage authentication and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Enable login for accessing the UI
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Audit logging</Label>
                <p className="text-sm text-muted-foreground">
                  Log all configuration changes
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>mTLS for remote instances</Label>
                <p className="text-sm text-muted-foreground">
                  Use mutual TLS for secure remote connections
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card className="mb-6 bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Storage
            </CardTitle>
            <CardDescription>
              Manage data and backup settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="backup">Backup interval (hours)</Label>
              <Input
                id="backup"
                type="number"
                defaultValue={24}
                className="bg-background border-border max-w-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Keep backup history</Label>
                <p className="text-sm text-muted-foreground">
                  Retain configuration backups
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline">Reset to Defaults</Button>
          <Button className="bg-gradient-primary hover:shadow-glow transition-all">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
