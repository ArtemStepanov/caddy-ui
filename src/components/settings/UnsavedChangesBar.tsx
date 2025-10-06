import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnsavedChangesBarProps {
  show: boolean;
  changedSectionsCount: number;
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export const UnsavedChangesBar = ({
  show,
  changedSectionsCount,
  isSaving,
  onSave,
  onDiscard,
}: UnsavedChangesBarProps) => {
  if (!show) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-card/95 backdrop-blur border-t border-border',
        'transition-transform duration-200',
        show ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className="container max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span>
              You have unsaved changes in {changedSectionsCount}{' '}
              {changedSectionsCount === 1 ? 'section' : 'sections'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onDiscard} disabled={isSaving}>
              Discard Changes
            </Button>
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save All'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
