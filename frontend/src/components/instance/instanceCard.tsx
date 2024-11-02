import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "../ui/badge";
import { EditInstanceDialog } from "./dialogs/editInstanceDialog.tsx";
import Instance from "@/models/instance";
import { cn } from "@/lib/utils";
import { DeleteInstanceAlertDialog } from "@/components/instance/dialogs/deleteInstanceAlertDialog.tsx";

interface InstanceCardProps {
  instance: Instance;
  onDeleteInstance?: () => void;
  onEditInstance?: () => void;
  className?: string;
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => (
  <Badge
    variant={status === "unknown" ? "destructive" : "default"}
    className={cn("h-4 w-17", className)}
  >
    {status}
  </Badge>
);

const InstanceAvatar = ({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string;
}) => (
  <Avatar>
    <AvatarImage
      src={imageUrl || "https://github.com/shadcn.png"}
      alt={`${name}'s Avatar`}
    />
    <AvatarFallback>{name[0]}</AvatarFallback>
  </Avatar>
);

const InstanceActions = ({
  instance,
  onDelete,
  onEdit,
}: {
  instance: Instance;
  onDelete?: () => void;
  onEdit?: () => void;
}) => (
  <div className="space-x-2">
    <DeleteInstanceAlertDialog instance={instance} onDelete={onDelete} />
    <EditInstanceDialog instance={instance} onEdit={onEdit} />
  </div>
);

const InstanceInfo = ({
  name,
  url,
  status,
}: {
  name: string;
  url: string;
  status: string;
}) => (
  <div className="min-w-0">
    <CardTitle className="flex items-center gap-2 text-base">
      <StatusBadge status={status} />
      <span className="truncate">{name}</span>
    </CardTitle>
    <CardDescription className="truncate">{url}</CardDescription>
  </div>
);

export default function InstanceCard({
  instance,
  onDeleteInstance,
  onEditInstance,
  className,
}: InstanceCardProps) {
  const status = instance.status || "unknown";

  return (
    <Card className={cn("w-[350px]", className)}>
      <CardHeader className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <InstanceAvatar name={instance.name} />
            <InstanceInfo
              name={instance.name}
              url={instance.url}
              status={status}
            />
          </div>
          <InstanceActions
            instance={instance}
            onDelete={onDeleteInstance}
            onEdit={onEditInstance}
          />
        </div>
      </CardHeader>
    </Card>
  );
}
