import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Instance from "@/models/instance";
import { DeleteInstanceButton } from "./deleteInstanceButton";
import { EditInstanceButton } from "./editInstanceButton";

function InstanceCard({ instance }: { instance: Instance }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage
              src="https://github.com/shadcn.png"
              alt="Instance Avatar"
            />
            <AvatarFallback>{instance.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{instance.name}</CardTitle>
            <CardDescription>{instance.url}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p>Status: {instance.status || "unknown"}</p>
      </CardContent>
      <CardFooter>
        <DeleteInstanceButton instance={instance} />
        <EditInstanceButton instance={instance} />
      </CardFooter>
    </Card>
  );
}

export default InstanceCard;
