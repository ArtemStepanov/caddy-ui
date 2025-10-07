import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { EditorSettings } from '@/types';
import { WIPSection } from './WIPSection';

interface EditorSettingsProps {
  settings: EditorSettings;
  onChange: (updates: Partial<EditorSettings>) => void;
}

export const EditorSettingsPanel = ({ settings, onChange }: EditorSettingsProps) => {
  const [localFontSize, setLocalFontSize] = useState(settings.fontSize);
  return (
    <WIPSection isWIP={true}>
      <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Editor</h2>
        <p className="text-muted-foreground">
          Customize code editor appearance and behavior
        </p>
      </div>

      {/* Code Editor Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Code Editor Preferences</CardTitle>
          <CardDescription>Font, layout, and display options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Font Family */}
          <div className="space-y-2">
            <Label htmlFor="fontFamily">Font Family</Label>
            <Select
              value={settings.fontFamily}
              onValueChange={(value) => onChange({ fontFamily: value })}
            >
              <SelectTrigger id="fontFamily" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fira Code">Fira Code</SelectItem>
                <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                <SelectItem value="Monaco">Monaco</SelectItem>
                <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Font Size</Label>
              <span className="text-sm text-muted-foreground">{localFontSize}px</span>
            </div>
            <Slider
              value={[localFontSize]}
              onValueChange={([value]) => setLocalFontSize(value)}
              onValueCommit={([value]) => onChange({ fontSize: value })}
              min={10}
              max={24}
              step={1}
              className="w-full"
            />
          </div>

          {/* Font Ligatures */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable font ligatures</Label>
              <p className="text-sm text-muted-foreground">
                Use special character combinations (→, ===)
              </p>
            </div>
            <Switch
              checked={settings.enableFontLigatures}
              onCheckedChange={(checked) =>
                onChange({ enableFontLigatures: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Editor Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>Editor Behavior</CardTitle>
          <CardDescription>Functionality and assistance features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label>Enable auto-completion</Label>
              <Switch
                checked={settings.enableAutoCompletion}
                onCheckedChange={(checked) =>
                  onChange({ enableAutoCompletion: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Enable code folding</Label>
              <Switch
                checked={settings.enableCodeFolding}
                onCheckedChange={(checked) =>
                  onChange({ enableCodeFolding: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Show minimap</Label>
              <Switch
                checked={settings.showMinimap}
                onCheckedChange={(checked) => onChange({ showMinimap: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Enable bracket matching</Label>
              <Switch
                checked={settings.enableBracketMatching}
                onCheckedChange={(checked) =>
                  onChange({ enableBracketMatching: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Word wrap</Label>
              <Switch
                checked={settings.wordWrap}
                onCheckedChange={(checked) => onChange({ wordWrap: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Tab Settings</CardTitle>
          <CardDescription>Indentation preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Indentation</Label>
            <RadioGroup
              value={settings.useSpaces ? `spaces-${settings.tabSize}` : 'tabs'}
              onValueChange={(value) => {
                if (value === 'tabs') {
                  onChange({ useSpaces: false });
                } else {
                  const size = parseInt(value.split('-')[1]);
                  onChange({ useSpaces: true, tabSize: size });
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spaces-2" id="spaces-2" />
                <Label htmlFor="spaces-2" className="font-normal cursor-pointer">
                  Spaces (2)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spaces-4" id="spaces-4" />
                <Label htmlFor="spaces-4" className="font-normal cursor-pointer">
                  Spaces (4)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tabs" id="tabs" />
                <Label htmlFor="tabs" className="font-normal cursor-pointer">
                  Tabs
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Validation */}
      <Card>
        <CardHeader>
          <CardTitle>Validation</CardTitle>
          <CardDescription>Real-time code validation settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable live validation while typing</Label>
              <p className="text-sm text-muted-foreground">
                Check syntax and errors in real-time
              </p>
            </div>
            <Switch
              checked={settings.enableLiveValidation}
              onCheckedChange={(checked) =>
                onChange({ enableLiveValidation: checked })
              }
            />
          </div>

          {settings.enableLiveValidation && (
            <div className="space-y-2">
              <Label htmlFor="validationDebounce">Validation delay (ms)</Label>
              <Input
                id="validationDebounce"
                type="number"
                value={settings.validationDebounce}
                onChange={(e) =>
                  onChange({ validationDebounce: parseInt(e.target.value) })
                }
                min={100}
                max={2000}
                step={100}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Wait time before validating
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-format on save</Label>
              <p className="text-sm text-muted-foreground">
                Format code automatically when saving
              </p>
            </div>
            <Switch
              checked={settings.autoFormatOnSave}
              onCheckedChange={(checked) =>
                onChange({ autoFormatOnSave: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuration Defaults */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Defaults</CardTitle>
          <CardDescription>Preferred format and diff viewer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Default Configuration Format</Label>
            <RadioGroup
              value={settings.defaultFormat}
              onValueChange={(value) =>
                onChange({ defaultFormat: value as EditorSettings['defaultFormat'] })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="format-json" />
                <Label htmlFor="format-json" className="font-normal cursor-pointer">
                  JSON Config (API format)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="caddyfile" id="format-caddyfile" />
                <Label htmlFor="format-caddyfile" className="font-normal cursor-pointer">
                  Caddyfile (DSL)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <Label>Show side-by-side diff</Label>
            <Switch
              checked={settings.showSideBySideDiff}
              onCheckedChange={(checked) =>
                onChange({ showSideBySideDiff: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Highlight syntax in diffs</Label>
            <Switch
              checked={settings.highlightSyntaxInDiffs}
              onCheckedChange={(checked) =>
                onChange({ highlightSyntaxInDiffs: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
    </WIPSection>
  );
};
