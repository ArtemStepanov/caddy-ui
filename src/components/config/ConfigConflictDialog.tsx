import { AlertTriangle, RefreshCw, FileCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ConfigConflictDialogProps } from '@/types';

export function ConfigConflictDialog({
  open,
  onClose,
  onReload,
  onOverwrite,
  onShowDiff,
}: ConfigConflictDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Configuration Conflict Detected
          </DialogTitle>
          <DialogDescription>
            Someone else modified the configuration while you were editing. Your changes cannot be
            applied.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            The server configuration has changed since you started editing. You need to decide how to
            proceed with your changes.
          </AlertDescription>
        </Alert>

        <div className="space-y-3 py-4">
          <h4 className="text-sm font-medium">What would you like to do?</h4>
          <div className="grid gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4"
              onClick={onReload}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Reload Server Config</div>
                <div className="text-xs text-muted-foreground">
                  Discard your changes and reload the latest version from the server
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4"
              onClick={onShowDiff}
            >
              <FileCode className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Show Differences</div>
                <div className="text-xs text-muted-foreground">
                  Compare your changes with the server version
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={onOverwrite}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Force Overwrite</div>
                <div className="text-xs opacity-90">
                  Apply your changes anyway, overwriting the server version (not recommended)
                </div>
              </div>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
