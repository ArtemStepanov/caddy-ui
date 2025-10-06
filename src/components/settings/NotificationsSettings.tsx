import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { NotificationSettings } from '@/types';
import { CheckCircle2, XCircle, Volume2 } from 'lucide-react';
import { WIPSection } from './WIPSection';

interface NotificationsSettingsProps {
  settings: NotificationSettings;
  onChange: (updates: Partial<NotificationSettings>) => void;
}

export const NotificationsSettings = ({
  settings,
  onChange,
}: NotificationsSettingsProps) => {
  const handleRequestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      onChange({ enableBrowserNotifications: permission === 'granted' });
    }
  };

  const notificationPermission =
    typeof Notification !== 'undefined' ? Notification.permission : 'default';

  return (
    <WIPSection isWIP={true}>
      <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Notifications</h2>
        <p className="text-muted-foreground">
          Configure alerts and notification preferences
        </p>
      </div>

      {/* System Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>System Notifications</CardTitle>
          <CardDescription>Browser notifications for important events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Browser Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable browser notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show desktop notifications for events
                </p>
              </div>
              <Switch
                checked={settings.enableBrowserNotifications}
                onCheckedChange={(checked) =>
                  onChange({ enableBrowserNotifications: checked })
                }
                disabled={notificationPermission === 'denied'}
              />
            </div>

            <div className="flex items-center gap-2">
              {notificationPermission === 'granted' && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Permission granted</span>
                </div>
              )}
              {notificationPermission === 'denied' && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span>Permission denied</span>
                </div>
              )}
              {notificationPermission === 'default' && (
                <Button variant="outline" size="sm" onClick={handleRequestPermission}>
                  Request Permission
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>Choose which events trigger notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Instance status changes</Label>
              <p className="text-sm text-muted-foreground">
                Healthy → unhealthy transitions
              </p>
            </div>
            <Switch
              checked={settings.notifyInstanceStatusChanges}
              onCheckedChange={(checked) =>
                onChange({ notifyInstanceStatusChanges: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Configuration changes</Label>
              <p className="text-sm text-muted-foreground">
                Apply success or failure
              </p>
            </div>
            <Switch
              checked={settings.notifyConfigChanges}
              onCheckedChange={(checked) =>
                onChange({ notifyConfigChanges: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Upstream health check failures</Label>
              <p className="text-sm text-muted-foreground">
                Backend health issues
              </p>
            </div>
            <Switch
              checked={settings.notifyUpstreamFailures}
              onCheckedChange={(checked) =>
                onChange({ notifyUpstreamFailures: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Orchestrator connection lost</Label>
              <p className="text-sm text-muted-foreground">
                Backend unavailable
              </p>
            </div>
            <Switch
              checked={settings.notifyConnectionLost}
              onCheckedChange={(checked) =>
                onChange({ notifyConnectionLost: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New version available</Label>
              <p className="text-sm text-muted-foreground">
                Update notifications
              </p>
            </div>
            <Switch
              checked={settings.notifyNewVersion}
              onCheckedChange={(checked) =>
                onChange({ notifyNewVersion: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* In-App Toasts */}
      <Card>
        <CardHeader>
          <CardTitle>In-App Toasts</CardTitle>
          <CardDescription>Toast notification settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="toastDuration">Toast Duration</Label>
            <Select
              value={settings.toastDuration.toString()}
              onValueChange={(value) =>
                onChange({ toastDuration: parseInt(value) })
              }
            >
              <SelectTrigger id="toastDuration" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 seconds</SelectItem>
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
                <SelectItem value="0">Until dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <Label>Play sound for notifications</Label>
            </div>
            <Switch
              checked={settings.playSound}
              onCheckedChange={(checked) => onChange({ playSound: checked })}
            />
          </div>

          {settings.playSound && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Volume</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.soundVolume}%
                </span>
              </div>
              <Slider
                value={[settings.soundVolume]}
                onValueChange={([value]) => onChange({ soundVolume: value })}
                min={0}
                max={100}
                step={10}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Email Alerts</CardTitle>
          <CardDescription>
            Email notifications for critical events
            <Badge variant="secondary" className="ml-2">
              Future Feature
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable email alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications
              </p>
            </div>
            <Switch
              checked={settings.enableEmailAlerts}
              onCheckedChange={(checked) =>
                onChange({ enableEmailAlerts: checked })
              }
            />
          </div>

          {settings.enableEmailAlerts && (
            <>
              <div className="space-y-2">
                <Label htmlFor="emailAddress">Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="emailAddress"
                    type="email"
                    value={settings.emailAddress}
                    onChange={(e) => onChange({ emailAddress: e.target.value })}
                    placeholder="user@example.com"
                  />
                  <Button variant="outline" disabled={!settings.emailAddress}>
                    {settings.emailVerified ? 'Verified' : 'Verify'}
                  </Button>
                </div>
                {settings.emailVerified && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Email verified
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
    </WIPSection>
  );
};
