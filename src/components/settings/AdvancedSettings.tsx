import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AdvancedSettings } from '@/types';
import { AlertTriangle, Code, Database, Download, Upload } from 'lucide-react';
import { WIPSection } from './WIPSection';

interface AdvancedSettingsProps {
  settings: AdvancedSettings;
  onChange: (updates: Partial<AdvancedSettings>) => void;
}

export const AdvancedSettingsPanel = ({
  settings,
  onChange,
}: AdvancedSettingsProps) => {
  const handleFeatureFlagChange = (flag: string, enabled: boolean) => {
    onChange({
      featureFlags: {
        ...settings.featureFlags,
        [flag]: enabled,
      },
    });
  };

  return (
    <WIPSection isWIP={true}>
      <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Advanced</h2>
        <p className="text-muted-foreground">
          Developer mode, performance, and experimental features
        </p>
      </div>

      {/* Performance & Debugging */}
      <Card>
        <CardHeader>
          <CardTitle>Performance & Debugging</CardTitle>
          <CardDescription>Developer tools and debugging options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              <Code className="h-4 w-4" />
              <div>
                <Label>Enable developer mode</Label>
                <p className="text-sm text-muted-foreground">
                  Show debug panel and verbose logging
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableDeveloperMode}
              onCheckedChange={(checked) =>
                onChange({ enableDeveloperMode: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable request/response logging</Label>
              <p className="text-sm text-muted-foreground">
                Log all API requests to console
              </p>
            </div>
            <Switch
              checked={settings.enableRequestLogging}
              onCheckedChange={(checked) =>
                onChange({ enableRequestLogging: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Network */}
      <Card>
        <CardHeader>
          <CardTitle>Network</CardTitle>
          <CardDescription>Request handling and retry configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="maxConcurrentRequests">Max concurrent requests</Label>
            <Input
              id="maxConcurrentRequests"
              type="number"
              value={settings.maxConcurrentRequests}
              onChange={(e) =>
                onChange({ maxConcurrentRequests: parseInt(e.target.value) })
              }
              min={1}
              max={20}
              className="max-w-xs"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Retry failed requests automatically</Label>
              <p className="text-sm text-muted-foreground">
                Retry on network errors
              </p>
            </div>
            <Switch
              checked={settings.enableAutoRetry}
              onCheckedChange={(checked) =>
                onChange({ enableAutoRetry: checked })
              }
            />
          </div>

          {settings.enableAutoRetry && (
            <div className="space-y-2">
              <Label htmlFor="maxRetryAttempts">Max retry attempts</Label>
              <Input
                id="maxRetryAttempts"
                type="number"
                value={settings.maxRetryAttempts}
                onChange={(e) =>
                  onChange({ maxRetryAttempts: parseInt(e.target.value) })
                }
                min={1}
                max={10}
                className="max-w-xs"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Strategy</CardTitle>
          <CardDescription>Data caching behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Cache Strategy</Label>
            <RadioGroup
              value={settings.cacheStrategy}
              onValueChange={(value) =>
                onChange({ cacheStrategy: value as AdvancedSettings['cacheStrategy'] })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="aggressive" id="cache-aggressive" />
                <Label htmlFor="cache-aggressive" className="font-normal cursor-pointer">
                  <span>Aggressive</span>
                  <p className="text-sm text-muted-foreground">
                    Cache everything possible
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="balanced" id="cache-balanced" />
                <Label htmlFor="cache-balanced" className="font-normal cursor-pointer">
                  <span>Balanced (default)</span>
                  <p className="text-sm text-muted-foreground">
                    Smart caching
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minimal" id="cache-minimal" />
                <Label htmlFor="cache-minimal" className="font-normal cursor-pointer">
                  <span>Minimal</span>
                  <p className="text-sm text-muted-foreground">
                    Fresh data always
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button variant="outline">
            <Database className="mr-2 h-4 w-4" />
            Clear All Caches
          </Button>
        </CardContent>
      </Card>

      {/* Experimental Features */}
      <Card>
        <CardHeader>
          <CardTitle>Experimental Features</CardTitle>
          <CardDescription>Beta and experimental functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Experimental features may be unstable. Use with caution.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label>Configuration Templates Library</Label>
                  <Badge variant="secondary">Beta</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pre-built configuration templates
                </p>
              </div>
              <Switch
                checked={settings.featureFlags.templatesLibrary}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange('templatesLibrary', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label>Multi-user Collaboration</Label>
                  <Badge variant="secondary">Experimental</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Real-time collaborative editing
                </p>
              </div>
              <Switch
                checked={settings.featureFlags.multiUserCollaboration}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange('multiUserCollaboration', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label>Prometheus Metrics Integration</Label>
                  <Badge variant="secondary">Beta</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Export metrics to Prometheus
                </p>
              </div>
              <Switch
                checked={settings.featureFlags.prometheusIntegration}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange('prometheusIntegration', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label>Docker Auto-discovery</Label>
                  <Badge variant="secondary">Experimental</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically discover Caddy containers
                </p>
              </div>
              <Switch
                checked={settings.featureFlags.dockerAutoDiscovery}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange('dockerAutoDiscovery', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label>AI-powered Config Suggestions</Label>
                  <Badge variant="secondary">Experimental</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Smart configuration recommendations
                </p>
              </div>
              <Switch
                checked={settings.featureFlags.aiConfigSuggestions}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange('aiConfigSuggestions', checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Destructive actions and data management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Export All Data</Label>
              <p className="text-sm text-muted-foreground">
                Export all settings and configurations
              </p>
            </div>
            <Button variant="outline" disabled>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Import Configuration</Label>
              <p className="text-sm text-muted-foreground">
                Import settings from file
              </p>
            </div>
            <Button variant="outline" disabled>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Reset to Factory Defaults</Label>
              <p className="text-sm text-muted-foreground">
                Delete all settings and configurations
              </p>
            </div>
            <Button variant="destructive" disabled>
              Reset Application
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </WIPSection>
  );
};
