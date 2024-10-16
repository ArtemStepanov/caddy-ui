import Instance from "@/models/instance";
import { Trash } from "lucide-react";
import { deleteCaddyInstance } from "@/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
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

export interface IDeleteInstanceButtonProps {
  instance: Instance;
}

export function DeleteInstanceButton({ instance }: IDeleteInstanceButtonProps) {
  return (
    // Uncaught Error: `DialogTrigger` must be used within `Dialog`
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Trash className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this instance? This action cannot be
            undone. This will permanently delete your account and remove your
            data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={deleteInstance(instance.id)}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function deleteInstance(
  id: string | null
): import("react").MouseEventHandler<HTMLButtonElement> | undefined {
  return (event) => {
    event.preventDefault();
    if (id) {
      deleteCaddyInstance(id).then(() => {
        toast({
          title: "Success",
          description: "Instance deleted successfully",
          variant: "default",
        });
      });
    } else {
      toast({
        title: "Error",
        description: "Instance ID is missing",
        variant: "destructive",
      });
    }
  };
}
