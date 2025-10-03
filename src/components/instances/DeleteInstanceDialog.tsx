import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DeleteInstanceDialogProps } from "@/types";
import { mapInstanceStatus } from "@/lib/instance-utils";

export function DeleteInstanceDialog({ 
  open, 
  onOpenChange, 
  instance, 
  onConfirm 
}: DeleteInstanceDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const status = mapInstanceStatus(instance.status);
  const isHealthy = status === 'healthy';

  const handleConfirm = async () => {
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onConfirm(instance.id);
      setConfirmed(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete instance:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isDeleting) {
      setConfirmed(false);
      onOpenChange(open);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-card border-border max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl">Delete Instance?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-3">
            <p>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{instance.name}</span>?{' '}
              This action cannot be undone.
            </p>
            
            {isHealthy && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-500">
                  This instance was recently active and appears to be healthy.
                </p>
              </div>
            )}

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Instance details:</p>
              <ul className="text-sm space-y-1">
                <li>
                  <span className="text-muted-foreground">URL:</span>{' '}
                  <code className="text-foreground">{instance.admin_url}</code>
                </li>
                <li>
                  <span className="text-muted-foreground">Auth:</span>{' '}
                  <span className="text-foreground">{instance.auth_type}</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <span className="text-foreground capitalize">{status}</span>
                </li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center space-x-2 py-3">
          <Checkbox
            id="confirm-delete"
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(checked === true)}
            disabled={isDeleting}
          />
          <Label
            htmlFor="confirm-delete"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            I understand this action is permanent
          </Label>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!confirmed || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Instance
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
