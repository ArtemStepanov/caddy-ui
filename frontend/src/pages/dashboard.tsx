import { useEffect, useState } from "react";
import InstanceCard from "@/components/instance/instanceCard";
import Instance from "@/models/instance";
import Api from "@/api.ts";
import { InstanceCardSkeleton } from "@/components/instance/skeletons.tsx";

function Dashboard() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Api.getCaddyInstances()
      .then(setInstances)
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteInstance = () => {
    Api.getCaddyInstances().then(setInstances);
  };

  const handleEditInstance = () => {
    Api.getCaddyInstances().then(setInstances);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Caddy Instances</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-2 p-2">
        {loading ? (
          <>
            <InstanceCardSkeleton />
            <InstanceCardSkeleton />
            <InstanceCardSkeleton />
            <InstanceCardSkeleton />
          </>
        ) : (
          instances.map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={instance}
              onDeleteInstance={handleDeleteInstance}
              onEditInstance={handleEditInstance}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
