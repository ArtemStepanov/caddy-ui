import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { SecuritySettings } from '@/types';
import { Key, Link as LinkIcon, Clock } from 'lucide-react';

interface SecuritySettingsProps {
  settings: SecuritySettings;
  onChange: (updates: Partial<SecuritySettings>) => void;
}

export const SecuritySettings = ({
  settings,
  onChange,
}: SecuritySettingsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Security</h2>
        <p className="text-muted-foreground">
          Authentication, access control, and audit logging
        </p>
      </div>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>
            Control session timeout and active sessions
            <Badge variant="secondary" className="ml-2">
              Future Feature
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className="text-muted-foreground">
                Current session: Browser on Linux
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Expires in: {settings.sessionTimeout} days
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (days)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) =>
                onChange({ sessionTimeout: parseInt(e.target.value) })
              }
              min={1}
              max={30}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Automatic logout after inactivity
            </p>
          </div>

          <Button variant="outline" disabled>
            End All Other Sessions
          </Button>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Personal access tokens for programmatic access
            <Badge variant="secondary" className="ml-2">
              Future Feature
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    ghp_xxxxxxxxxxxxxxxxxxx
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created 2 days ago, Last used: 1 hour ago
                  </p>
                </div>
              </div>
              <Button variant="destructive" size="sm" disabled>
                Revoke
              </Button>
            </div>
          </div>

          <Button variant="outline" disabled>
            Generate New Token
          </Button>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>
            Track all configuration changes and sensitive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable audit logging</Label>
              <p className="text-sm text-muted-foreground">
                Log all configuration changes
              </p>
            </div>
            <Switch
              checked={settings.enableAuditLogging}
              onCheckedChange={(checked) =>
                onChange({ enableAuditLogging: checked })
              }
            />
          </div>

          {settings.enableAuditLogging && (
            <>
              <div className="space-y-2">
                <Label htmlFor="logRetentionDays">Log Retention (days)</Label>
                <Input
                  id="logRetentionDays"
                  type="number"
                  value={settings.logRetentionDays}
                  onChange={(e) =>
                    onChange({ logRetentionDays: parseInt(e.target.value) })
                  }
                  min={7}
                  max={365}
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground">
                  How long to keep audit logs
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" disabled>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  View Audit Log
                </Button>
                <Button variant="outline" disabled>
                  Export Audit Log
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
