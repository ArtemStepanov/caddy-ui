import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AppearanceSettings, DashboardPreferences } from '@/types';
import { Monitor, Sun, Moon } from 'lucide-react';
import { WIPSection } from './WIPSection';

interface GeneralSettingsProps {
  appearance: AppearanceSettings;
  dashboard: DashboardPreferences;
  onAppearanceChange: (updates: Partial<AppearanceSettings>) => void;
  onDashboardChange: (updates: Partial<DashboardPreferences>) => void;
}

export const GeneralSettings = ({
  appearance,
  dashboard,
  onAppearanceChange,
  onDashboardChange,
}: GeneralSettingsProps) => {
  const [localRefreshInterval, setLocalRefreshInterval] = useState(dashboard.refreshInterval);

  return (
    <WIPSection isWIP={false}>
      <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">General</h2>
        <p className="text-muted-foreground">
          Configure appearance and dashboard preferences
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="space-y-3">
            <Label>Theme</Label>
            <RadioGroup
              value={appearance.theme}
              onValueChange={(value) =>
                onAppearanceChange({ theme: value as AppearanceSettings['theme'] })
              }
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label
                  htmlFor="light"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Sun className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">Light</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label
                  htmlFor="dark"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Moon className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">Dark</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="auto" id="auto" className="peer sr-only" />
                <Label
                  htmlFor="auto"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Monitor className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">Auto</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="language">Interface Language</Label>
            <Select
              value={appearance.language}
              onValueChange={(value) => onAppearanceChange({ language: value })}
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time Format */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={appearance.dateFormat}
                onValueChange={(value) =>
                  onAppearanceChange({ dateFormat: value as AppearanceSettings['dateFormat'] })
                }
              >
                <SelectTrigger id="dateFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeFormat">Time Format</Label>
              <Select
                value={appearance.timeFormat}
                onValueChange={(value) =>
                  onAppearanceChange({ timeFormat: value as AppearanceSettings['timeFormat'] })
                }
              >
                <SelectTrigger id="timeFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24-hour</SelectItem>
                  <SelectItem value="12h">12-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Relative Timestamps */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show relative timestamps</Label>
              <p className="text-sm text-muted-foreground">
                Display times like "5 minutes ago"
              </p>
            </div>
            <Switch
              checked={appearance.showRelativeTimestamps}
              onCheckedChange={(checked) =>
                onAppearanceChange({ showRelativeTimestamps: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Preferences</CardTitle>
          <CardDescription>Customize your dashboard experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Refresh Interval */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Refresh Interval</Label>
              <span className="text-sm text-muted-foreground">
                {localRefreshInterval}s
              </span>
            </div>
            <Slider
              value={[localRefreshInterval]}
              onValueChange={([value]) => setLocalRefreshInterval(value)}
              onValueCommit={([value]) => onDashboardChange({ refreshInterval: value })}
              min={10}
              max={300}
              step={10}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              How often to refresh data (10s - 5min)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
    </WIPSection>
  );
};
