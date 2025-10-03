import { useState, useCallback } from 'react';
import { Upload, FileCode, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

interface ImportConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (content: string, validate: boolean) => Promise<void>;
}

export function ImportConfigDialog({ open, onClose, onImport }: ImportConfigDialogProps) {
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [validateBeforeImport, setValidateBeforeImport] = useState(true);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message?: string;
  } | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      setValidationResult(null);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      setValidationResult(null);
    };
    reader.readAsText(file);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleImport = async () => {
    if (!fileContent) return;

    setImporting(true);
    try {
      await onImport(fileContent, validateBeforeImport);
      onClose();
      // Reset state
      setFileContent('');
      setFileName('');
      setValidationResult(null);
    } catch (error) {
      setValidationResult({
        valid: false,
        message: error instanceof Error ? error.message : 'Import failed',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Configuration</DialogTitle>
          <DialogDescription>
            Upload a JSON or Caddyfile configuration to import
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drag & Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          >
            <input
              type="file"
              id="config-file"
              accept=".json,.caddyfile,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label htmlFor="config-file" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">
                {fileName || 'Drag & drop a configuration file here'}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse files (JSON, Caddyfile)
              </p>
            </label>
          </div>

          {/* Preview */}
          {fileContent && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <Textarea
                value={fileContent}
                readOnly
                className="font-mono text-xs h-48 resize-none"
              />
            </div>
          )}

          {/* Import Options */}
          {fileContent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Import Mode</Label>
                <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as 'replace' | 'merge')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="replace" id="replace" />
                    <Label htmlFor="replace" className="font-normal cursor-pointer">
                      Replace current configuration
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="merge" id="merge" disabled />
                    <Label
                      htmlFor="merge"
                      className="font-normal cursor-pointer text-muted-foreground"
                    >
                      Merge with current (Advanced - Coming soon)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validate"
                  checked={validateBeforeImport}
                  onCheckedChange={(checked) => setValidateBeforeImport(checked as boolean)}
                />
                <Label htmlFor="validate" className="font-normal cursor-pointer">
                  Validate configuration before importing
                </Label>
              </div>
            </div>
          )}

          {/* Validation Result */}
          {validationResult && (
            <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
              {validationResult.valid ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                {validationResult.message ||
                  (validationResult.valid
                    ? 'Configuration is valid'
                    : 'Configuration validation failed')}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!fileContent || importing}>
            {importing ? (
              <>
                <FileCode className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FileCode className="w-4 h-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
