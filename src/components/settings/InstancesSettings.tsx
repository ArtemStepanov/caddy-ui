import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { InstancesSettings } from '@/types';
import { WIPSection } from './WIPSection';

interface InstancesSettingsProps {
  settings: InstancesSettings;
  onChange: (updates: Partial<InstancesSettings>) => void;
}

export const InstancesSettingsPanel = ({
  settings,
  onChange,
}: InstancesSettingsProps) => {
  return (
    <WIPSection isWIP={true}>
      <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Instances</h2>
        <p className="text-muted-foreground">
          Configure default settings for Caddy instances
        </p>
      </div>

      {/* Default Connection Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Default Connection Settings</CardTitle>
          <CardDescription>
            Applied to new instances when adding them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Timeout */}
          <div className="space-y-2">
            <Label htmlFor="defaultTimeout">Default Timeout (seconds)</Label>
            <Input
              id="defaultTimeout"
              type="number"
              value={settings.defaultTimeout}
              onChange={(e) =>
                onChange({ defaultTimeout: parseInt(e.target.value) })
              }
              min={1}
              max={120}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Connection timeout for API requests
            </p>
          </div>

          {/* Default Auth Type */}
          <div className="space-y-2">
            <Label htmlFor="defaultAuthType">Default Authentication Type</Label>
            <Select
              value={settings.defaultAuthType}
              onValueChange={(value) => onChange({ defaultAuthType: value })}
            >
              <SelectTrigger id="defaultAuthType" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="mtls">mTLS</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Pre-fill when adding new instances
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Health Check Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Health Check Settings</CardTitle>
          <CardDescription>Configure automatic health monitoring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Health Checks */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable health checks by default</Label>
              <p className="text-sm text-muted-foreground">
                Automatically monitor instance status
              </p>
            </div>
            <Switch
              checked={settings.enableHealthChecks}
              onCheckedChange={(checked) =>
                onChange({ enableHealthChecks: checked })
              }
            />
          </div>

          {settings.enableHealthChecks && (
            <>
              {/* Check Interval */}
              <div className="space-y-2">
                <Label htmlFor="healthCheckInterval">Check interval (seconds)</Label>
                <Input
                  id="healthCheckInterval"
                  type="number"
                  value={settings.healthCheckInterval}
                  onChange={(e) =>
                    onChange({ healthCheckInterval: parseInt(e.target.value) })
                  }
                  min={5}
                  max={300}
                  className="max-w-xs"
                />
              </div>

              {/* Unhealthy Threshold */}
              <div className="space-y-2">
                <Label htmlFor="unhealthyThreshold">Unhealthy threshold</Label>
                <Input
                  id="unhealthyThreshold"
                  type="number"
                  value={settings.unhealthyThreshold}
                  onChange={(e) =>
                    onChange({ unhealthyThreshold: parseInt(e.target.value) })
                  }
                  min={1}
                  max={10}
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground">
                  Consecutive failures before marking unhealthy
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Instance Management */}
      <Card>
        <CardHeader>
          <CardTitle>Instance Management</CardTitle>
          <CardDescription>Bulk operations and confirmations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Show Bulk Confirmation */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show confirmation for bulk delete</Label>
              <p className="text-sm text-muted-foreground">
                Prevent accidental mass deletions
              </p>
            </div>
            <Switch
              checked={settings.showBulkConfirmation}
              onCheckedChange={(checked) =>
                onChange({ showBulkConfirmation: checked })
              }
            />
          </div>

          {/* Double Confirmation */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require double confirmation for dangerous actions</Label>
              <p className="text-sm text-muted-foreground">
                Extra safety for destructive operations
              </p>
            </div>
            <Switch
              checked={settings.requireDoubleConfirmation}
              onCheckedChange={(checked) =>
                onChange({ requireDoubleConfirmation: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
    </WIPSection>
  );
};
