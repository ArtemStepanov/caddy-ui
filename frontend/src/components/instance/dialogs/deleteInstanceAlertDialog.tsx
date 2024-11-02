import Instance from "@/models/instance";
import { Trash } from "lucide-react";
import { useExceptionWrapper } from "@/hooks/useExceptionWrapper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Api from "@/api.ts";
import { Button } from "@/components/ui/button.tsx";
import { Loader } from "@/components/common/loader.tsx";

interface DeleteInstanceButtonProps {
  instance: Instance;
  onDelete?: () => void;
}

export function DeleteInstanceAlertDialog({
  instance,
  onDelete,
}: DeleteInstanceButtonProps) {
  const { execute: handleDelete, loading: isDeleting } = useExceptionWrapper(
    async () => {
      if (!instance.id) return;
      await Api.deleteCaddyInstance(instance.id);
      onDelete?.();
      return {
        success: {
          title: "Instance Deleted",
          description: `Instance "${instance.name}" has been successfully deleted.`,
        },
        error: {
          title: "Deletion Failed",
          description: `Failed to delete instance "${instance.name}". Please try again.`,
        },
      };
    },
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Delete instance ${instance.name}`}
        >
          <Trash className="h-3 w-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Instance</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete instance "{instance.name}"? This
            action cannot be undone and will permanently remove the instance
            configuration from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? <Loader /> : "Delete Instance"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
