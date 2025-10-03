import { useState, useEffect } from 'react';
import {
  FileCode,
  Save,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInstances } from '@/hooks/useInstances';
import { useConfigEditor } from '@/hooks/useConfigEditor';
import {
  ConfigEditor,
  ConfigConflictDialog,
  ConfigDiffViewer,
  ImportConfigDialog,
  ExportConfigMenu,
  ValidationErrorPanel,
  UnsavedChangesDialog,
} from '@/components/config';
import { formatDistanceToNow } from 'date-fns';

const Config = () => {
  const { instances, loading: instancesLoading } = useInstances();
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'json' | 'caddyfile'>('json');
  const [caddyfileContent, setCaddyfileContent] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Dialogs state
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingInstanceChange, setPendingInstanceChange] = useState<string | null>(null);

  const {
    config,
    originalConfig,
    loading,
    hasUnsavedChanges,
    validationErrors,
    lastUpdated,
    fetchConfig,
    updateConfig,
    validateConfig,
    formatConfig,
    adaptCaddyfile,
    handleConfigChange,
  } = useConfigEditor(selectedInstanceId);

  // Auto-select first instance
  useEffect(() => {
    if (instances.length > 0 && !selectedInstanceId) {
      setSelectedInstanceId(instances[0].id);
    }
  }, [instances, selectedInstanceId]);

  // Fetch config when instance changes
  useEffect(() => {
    if (selectedInstanceId) {
      fetchConfig(undefined, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstanceId]);

  const handleInstanceChange = (newInstanceId: string) => {
    if (hasUnsavedChanges) {
      setPendingInstanceChange(newInstanceId);
      setShowUnsavedDialog(true);
    } else {
      setSelectedInstanceId(newInstanceId);
    }
  };

  const handleRefresh = async () => {
    if (hasUnsavedChanges) {
      if (
        !confirm(
          'Reload will overwrite your unsaved changes. Do you want to continue?'
        )
      ) {
        return;
      }
    }

    setRefreshing(true);
    try {
      await fetchConfig(undefined, false);
    } finally {
      setRefreshing(false);
    }
  };

  const handleApplyChanges = async () => {
    try {
      // Validate first
      const isValid = await validateConfig(config);
      if (!isValid) {
        return;
      }

      // Apply changes
      await updateConfig(config, undefined, true, false);
    } catch (error: unknown) {
      // Handle ETag conflict
      if (error instanceof Error && error.message === 'ETAG_CONFLICT') {
        setShowConflictDialog(true);
      }
    }
  };

  const handleForceOverwrite = async () => {
    setShowConflictDialog(false);
    try {
      await updateConfig(config, undefined, false, true);
    } catch (error) {
      // Error already handled by updateConfig
    }
  };

  const handleReloadServerConfig = async () => {
    setShowConflictDialog(false);
    await fetchConfig(undefined, false);
  };

  const handleShowDiff = () => {
    setShowConflictDialog(false);
    setShowDiffViewer(true);
  };

  const handleValidate = async () => {
    await validateConfig(config);
  };

  const handleFormat = () => {
    const formatted = formatConfig(config);
    handleConfigChange(formatted);
  };

  const handleTabChange = async (value: string) => {
    if (value === 'caddyfile' && activeTab === 'json') {
      // When switching to Caddyfile, we'd need reverse conversion (not available)
      // For now, keep empty or show placeholder
      setCaddyfileContent('# Caddyfile view\n# Convert JSON to Caddyfile manually or use Caddy tools');
    } else if (value === 'json' && activeTab === 'caddyfile') {
      // Adapt Caddyfile to JSON
      if (caddyfileContent && caddyfileContent !== config) {
        const adapted = await adaptCaddyfile(caddyfileContent);
        if (adapted) {
          handleConfigChange(adapted);
        }
      }
    }
    setActiveTab(value as 'json' | 'caddyfile');
  };

  const handleImport = async (content: string, validate: boolean) => {
    try {
      // Try to parse as JSON first
      JSON.parse(content);
      
      if (validate) {
        const isValid = await validateConfig(content);
        if (!isValid) {
          throw new Error('Imported configuration is invalid');
        }
      }

      handleConfigChange(content);
      setShowImportDialog(false);
    } catch (error) {
      // If not JSON, might be Caddyfile
      const adapted = await adaptCaddyfile(content);
      if (adapted) {
        handleConfigChange(adapted);
        setShowImportDialog(false);
      } else {
        throw new Error('Invalid configuration format');
      }
    }
  };

  const selectedInstance = instances.find((i) => i.id === selectedInstanceId);

  if (instancesLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[700px] w-full" />
        </div>
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-dark p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileCode className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Instances Available</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You need to add a Caddy instance before you can view or edit configurations.
              </p>
              <Button className="mt-6" onClick={() => (window.location.href = '/instances')}>
                Go to Instances
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold">Configuration</h1>
              <p className="text-muted-foreground mt-1">View and edit Caddy configurations</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              {selectedInstance && (
                <ExportConfigMenu
                  jsonConfig={config}
                  caddyfileConfig={caddyfileContent}
                  instanceName={selectedInstance.name}
                />
              )}
              <Button
                onClick={handleApplyChanges}
                disabled={!hasUnsavedChanges || loading || validationErrors.length > 0}
                className="bg-gradient-primary hover:shadow-glow transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Apply Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Instance Selector */}
        <Card className="mb-6 bg-card/50 backdrop-blur border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Instance:</label>
              <Select value={selectedInstanceId} onValueChange={handleInstanceChange}>
                <SelectTrigger className="w-64 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={instance.status === 'online' ? 'default' : 'secondary'}
                          className="w-2 h-2 p-0 rounded-full"
                        />
                        {instance.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRefresh}
                      disabled={refreshing || loading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Last synced:{' '}
                      {lastUpdated ? formatDistanceToNow(lastUpdated, { addSuffix: true }) : 'Never'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-orange-500 border-orange-500">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Unsaved changes
                  </Badge>
                )}
                {!hasUnsavedChanges && !loading && (
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Saved
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="json">JSON Config</TabsTrigger>
                <TabsTrigger value="caddyfile">Caddyfile</TabsTrigger>
              </TabsList>

              <TabsContent value="json" className="mt-0">
                {loading && !config ? (
                  <Skeleton className="h-[600px] w-full" />
                ) : (
                  <ConfigEditor
                    value={config}
                    onChange={(value) => handleConfigChange(value || '')}
                    language="json"
                    readOnly={loading}
                  />
                )}
              </TabsContent>

              <TabsContent value="caddyfile" className="mt-0">
                <ConfigEditor
                  value={caddyfileContent}
                  onChange={setCaddyfileContent}
                  language="caddyfile"
                />
                <p className="text-sm text-muted-foreground mt-4">
                  Caddyfile will be adapted to JSON when you switch back to the JSON tab or apply changes.
                </p>
              </TabsContent>
            </Tabs>

            {/* Status Bar */}
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Last updated:{' '}
                {lastUpdated ? formatDistanceToNow(lastUpdated, { addSuffix: true }) : 'Never'}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleValidate} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Validate'
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleFormat} disabled={loading}>
                  Format
                </Button>
              </div>
            </div>

            {/* Validation Errors */}
            <ValidationErrorPanel errors={validationErrors} />
          </CardContent>
        </Card>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Zero-Downtime Reload
              </h3>
              <p className="text-sm text-muted-foreground">
                Configuration changes are applied gracefully without dropping connections. Invalid
                configs are automatically rejected.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Concurrent Safety
              </h3>
              <p className="text-sm text-muted-foreground">
                Uses ETag/If-Match headers to prevent conflicting changes when multiple users edit
                the same configuration.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        <ConfigConflictDialog
          open={showConflictDialog}
          onClose={() => setShowConflictDialog(false)}
          onReload={handleReloadServerConfig}
          onOverwrite={handleForceOverwrite}
          onShowDiff={handleShowDiff}
        />

        <ConfigDiffViewer
          open={showDiffViewer}
          onClose={() => setShowDiffViewer(false)}
          originalValue={originalConfig}
          modifiedValue={config}
          onAcceptServer={handleReloadServerConfig}
          onAcceptLocal={handleForceOverwrite}
        />

        <ImportConfigDialog
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={handleImport}
        />

        <UnsavedChangesDialog
          open={showUnsavedDialog}
          onClose={() => {
            setShowUnsavedDialog(false);
            setPendingInstanceChange(null);
          }}
          onDiscard={() => {
            setShowUnsavedDialog(false);
            if (pendingInstanceChange) {
              setSelectedInstanceId(pendingInstanceChange);
              setPendingInstanceChange(null);
            }
          }}
          onSave={async () => {
            await handleApplyChanges();
            setShowUnsavedDialog(false);
            if (pendingInstanceChange) {
              setSelectedInstanceId(pendingInstanceChange);
              setPendingInstanceChange(null);
            }
          }}
        />
      </div>
    </div>
  );
};

export default Config;
