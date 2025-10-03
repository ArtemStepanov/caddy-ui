import { DiffEditor } from '@monaco-editor/react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ConfigDiffViewerProps {
  open: boolean;
  onClose: () => void;
  originalValue: string;
  modifiedValue: string;
  onAcceptServer: () => void;
  onAcceptLocal: () => void;
  title?: string;
  description?: string;
}

export function ConfigDiffViewer({
  open,
  onClose,
  originalValue,
  modifiedValue,
  onAcceptServer,
  onAcceptLocal,
  title = 'Configuration Changes',
  description = 'Compare the server version with your local changes',
}: ConfigDiffViewerProps) {
  const [currentDiff, setCurrentDiff] = useState(0);
  const diffEditorRef = useState<unknown>(null);

  function handleEditorDidMount(editor: unknown) {
    diffEditorRef[0] = editor;
    
    // Configure diff editor
    editor.updateOptions({
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
      readOnly: true,
      renderSideBySide: true,
      enableSplitViewResizing: true,
      originalEditable: false,
      minimap: { enabled: false },
    });
  }

  function navigateToDiff(direction: 'next' | 'prev') {
    // This would require access to Monaco's diff navigator
    // For now, this is a placeholder for the UI
    if (direction === 'next') {
      setCurrentDiff((prev) => prev + 1);
    } else {
      setCurrentDiff((prev) => Math.max(0, prev - 1));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] h-[800px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Server (Current)</span>
            <span className="text-muted-foreground">vs</span>
            <span className="text-sm font-medium">Your Changes</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToDiff('prev')}
              disabled={currentDiff === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateToDiff('next')}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 border border-border rounded-lg overflow-hidden">
          <DiffEditor
            height="100%"
            language="json"
            original={originalValue}
            modified={modifiedValue}
            theme="vs-dark"
            onMount={handleEditorDidMount}
            loading={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            }
            options={{
              readOnly: true,
              renderSideBySide: true,
            }}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onAcceptServer}>
            Accept Server Version
          </Button>
          <Button onClick={onAcceptLocal} className="bg-gradient-primary">
            Apply My Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
