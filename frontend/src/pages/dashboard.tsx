import { useEffect, useState } from "react";
import InstanceCard from "@/components/instanceCard";
import Instance from "@/models/instance";
import { getCaddyInstances } from "@/api";

function Dashboard() {
  const [instances, setInstances] = useState<Instance[]>([]);

  useEffect(() => {
    getCaddyInstances().then(setInstances);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Caddy Instances</h1>
      <div className="grid gap-4">
        {instances.map((instance) => (
          <InstanceCard key={instance.id} instance={instance} />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
