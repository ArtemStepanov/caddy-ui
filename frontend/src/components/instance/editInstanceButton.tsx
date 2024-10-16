import Instance from "@/models/instance";
import { Edit } from "lucide-react";
import { updateCaddyInstance } from "@/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { EditInstanceDialog } from "./editInstanceDialog";

export interface IEditInstanceButtonProps {
  instance: Instance;
}

export function EditInstanceButton({ instance }: IEditInstanceButtonProps) {
  return (
    <div>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" onClick={editInstance(instance)}>
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <EditInstanceDialog instance={instance} />
    </div>
  );
}

function editInstance(
  instance: Instance
): import("react").MouseEventHandler<HTMLButtonElement> | undefined {
  return (event) => {
    event.preventDefault();
    try {
      updateCaddyInstance(instance).then(() => {
        toast({
          title: "Success",
          description: "Instance deleted successfully",
          variant: "default",
        });
      });
    } catch {
      toast({
        title: "Error",
        description: "Error updating instance",
        variant: "destructive",
      });
    }
  };
}
