import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { OrchestratorSettings } from '@/types';
import { CheckCircle2, XCircle, Loader2, Wifi, Radio } from 'lucide-react';
import { WIPSection } from './WIPSection';

interface OrchestratorSettingsProps {
  settings: OrchestratorSettings;
  onChange: (updates: Partial<OrchestratorSettings>) => void;
}

export const OrchestratorSettingsPanel = ({
  settings,
  onChange,
}: OrchestratorSettingsProps) => {
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const response = await fetch(settings.backendUrl + '/api/health');
      if (response.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    } catch {
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <WIPSection isWIP={true}>
      <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Orchestrator</h2>
        <p className="text-muted-foreground">
          Configure backend connection and storage settings
        </p>
      </div>

      {/* Server Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Server Configuration</CardTitle>
          <CardDescription>Backend API connection settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Backend URL */}
          <div className="space-y-2">
            <Label htmlFor="backendUrl">Backend API URL</Label>
            <div className="flex gap-2">
              <Input
                id="backendUrl"
                value={settings.backendUrl}
                onChange={(e) => onChange({ backendUrl: e.target.value })}
                placeholder="http://localhost:3000"
              />
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </div>
            {connectionStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Connected successfully
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-4 w-4" />
                Connection failed
              </div>
            )}
          </div>

          {/* API Timeout */}
          <div className="space-y-2">
            <Label htmlFor="apiTimeout">API Timeout (seconds)</Label>
            <Input
              id="apiTimeout"
              type="number"
              value={settings.apiTimeout}
              onChange={(e) => onChange({ apiTimeout: parseInt(e.target.value) })}
              min={5}
              max={120}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Maximum time to wait for API responses
            </p>
          </div>

          {/* Polling Strategy */}
          <div className="space-y-3">
            <Label>Polling Strategy</Label>
            <RadioGroup
              value={settings.pollingStrategy}
              onValueChange={(value) =>
                onChange({ pollingStrategy: value as OrchestratorSettings['pollingStrategy'] })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="websocket" id="strategy-websocket" />
                <Label htmlFor="strategy-websocket" className="font-normal cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    <span>WebSocket</span>
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Real-time updates</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="http-polling" id="strategy-polling" />
                <Label htmlFor="strategy-polling" className="font-normal cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4" />
                    <span>HTTP Polling</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Fallback for older browsers
                  </p>
                </Label>
              </div>
            </RadioGroup>

            {settings.pollingStrategy === 'http-polling' && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="pollInterval">Poll Interval (seconds)</Label>
                <Input
                  id="pollInterval"
                  type="number"
                  value={settings.pollInterval}
                  onChange={(e) => onChange({ pollInterval: parseInt(e.target.value) })}
                  min={5}
                  max={300}
                  className="max-w-xs"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storage & Persistence */}
      <Card>
        <CardHeader>
          <CardTitle>Storage & Persistence</CardTitle>
          <CardDescription>Local storage and auto-save configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Local Storage Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Local Storage</Label>
              <span className="text-sm text-muted-foreground">2.3 MB / 50 MB</span>
            </div>
            <Progress value={4.6} className="h-2" />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Used for caching and offline support
              </p>
              <Button variant="outline" size="sm">
                Clear Cache
              </Button>
            </div>
          </div>

          {/* Auto-save Settings */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable auto-save</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save unsaved changes
              </p>
            </div>
            <Switch
              checked={settings.enableAutoSave}
              onCheckedChange={(checked) => onChange({ enableAutoSave: checked })}
            />
          </div>

          {settings.enableAutoSave && (
            <div className="space-y-2">
              <Label htmlFor="autoSaveInterval">Auto-save interval (seconds)</Label>
              <Input
                id="autoSaveInterval"
                type="number"
                value={settings.autoSaveInterval}
                onChange={(e) =>
                  onChange({ autoSaveInterval: parseInt(e.target.value) })
                }
                min={10}
                max={300}
                className="max-w-xs"
              />
            </div>
          )}

          {/* Restore Unsaved Changes */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Restore unsaved changes on reload</Label>
              <p className="text-sm text-muted-foreground">
                Recover work after browser refresh
              </p>
            </div>
            <Switch
              checked={settings.restoreUnsavedChanges}
              onCheckedChange={(checked) =>
                onChange({ restoreUnsavedChanges: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
    </WIPSection>
  );
};
