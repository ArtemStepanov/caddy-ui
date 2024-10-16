import Instance from "@/models/instance";
import { EditInstanceDialog } from "../instance/editInstanceDialog";

export interface IEditInstanceButtonProps {
  instance: Instance;
}

export function EditInstanceButton({ instance }: IEditInstanceButtonProps) {
  return <EditInstanceDialog instance={instance} />;
}
