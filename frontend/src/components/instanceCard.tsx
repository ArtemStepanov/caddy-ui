import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Instance from '../models/instance';

function InstanceCard({ instance }: { instance: Instance }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="Instance Avatar" />
            <AvatarFallback>{instance.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{instance.name}</CardTitle>
            <CardDescription>{instance.url}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p>Status: {instance.status || 'unknown'}</p>
      </CardContent>
    </Card>
  );
}

export default InstanceCard;