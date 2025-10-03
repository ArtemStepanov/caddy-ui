import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { UnsavedChangesDialogProps } from '@/types';

export function UnsavedChangesDialog({
  open,
  onClose,
  onDiscard,
  onSave,
  title = 'You have unsaved changes',
  description = 'If you leave, your changes will be lost. Do you want to continue?',
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Stay</AlertDialogCancel>
          {onSave && (
            <AlertDialogAction onClick={onSave} className="bg-primary">
              Save & Continue
            </AlertDialogAction>
          )}
          <AlertDialogAction onClick={onDiscard} variant="destructive">
            Discard Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
