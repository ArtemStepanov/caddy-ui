import { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Grid3x3, 
  List,
  X,
  Filter,
  Activity,
  AlertCircle,
  Server as ServerIcon,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstances } from "@/hooks/useInstances";
import {
  mapInstanceStatus,
  calculateStats,
  filterInstancesBySearch,
  filterInstancesByStatus,
  sortInstances,
  InstanceStatus,
} from "@/lib/instance-utils";
import { AddInstanceDialog } from "@/components/instances/AddInstanceDialog";
import { EditInstanceDialog } from "@/components/instances/EditInstanceDialog";
import { DeleteInstanceDialog } from "@/components/instances/DeleteInstanceDialog";
import { TestConnectionDialog } from "@/components/instances/TestConnectionDialog";
import { InstanceGridCard } from "@/components/instances/InstanceGridCard";
import { InstanceTableView } from "@/components/instances/InstanceTableView";
import { EmptyState } from "@/components/instances/EmptyState";
import { CaddyInstance } from "@/lib/api-client";

type ViewMode = 'grid' | 'table';
type FilterStatus = 'all' | InstanceStatus;

const Instances = () => {
  const { instances, loading, createInstance, updateInstance, deleteInstance, testConnection } = useInstances();
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'last_seen'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState<CaddyInstance | null>(null);
  const [deletingInstance, setDeletingInstance] = useState<CaddyInstance | null>(null);
  const [testingInstance, setTestingInstance] = useState<CaddyInstance | null>(null);
  
  // Bulk selection (for table view)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Calculate stats
  const stats = useMemo(() => calculateStats(instances), [instances]);

  // Filter and sort instances
  const filteredInstances = useMemo(() => {
    let filtered = instances;
    
    // Apply search filter
    filtered = filterInstancesBySearch(filtered, searchQuery);
    
    // Apply status filter
    filtered = filterInstancesByStatus(filtered, statusFilter);
    
    // Apply sorting
    filtered = sortInstances(filtered, sortBy, sortOrder);
    
    return filtered;
  }, [instances, searchQuery, statusFilter, sortBy, sortOrder]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const handleEditInstance = (instance: CaddyInstance) => {
    setEditingInstance(instance);
  };

  const handleDeleteInstance = (instance: CaddyInstance) => {
    setDeletingInstance(instance);
  };

  const handleTestConnection = (instance: CaddyInstance) => {
    setTestingInstance(instance);
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredInstances.map(i => i.id) : []);
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Caddy Instances
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your connected Caddy server instances
              </p>
            </div>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-gradient-primary hover:shadow-glow transition-all"
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Instance
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <ServerIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Healthy</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{stats.healthy}</p>
            </div>
            <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Unhealthy</span>
              </div>
              <p className="text-2xl font-bold text-orange-500">{stats.unhealthy}</p>
            </div>
            <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <HelpCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Unreachable</span>
              </div>
              <p className="text-2xl font-bold text-red-500">{stats.unreachable}</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, URL, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card/50 backdrop-blur border-border"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('table')}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Badge
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Badge>
            <Badge
              variant={statusFilter === 'healthy' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('healthy')}
            >
              Healthy
            </Badge>
            <Badge
              variant={statusFilter === 'unhealthy' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('unhealthy')}
            >
              Unhealthy
            </Badge>
            <Badge
              variant={statusFilter === 'unreachable' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('unreachable')}
            >
              Unreachable
            </Badge>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="ml-auto"
              >
                <X className="w-4 h-4 mr-1" />
                Reset filters
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          // Loading Skeletons
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full bg-card/50" />
            ))}
          </div>
        ) : instances.length === 0 ? (
          // Empty State (no instances at all)
          <EmptyState onAddInstance={() => setAddDialogOpen(true)} />
        ) : filteredInstances.length === 0 ? (
          // No results from filters
          <div className="text-center py-12">
            <ServerIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No instances found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={handleResetFilters}>
              Reset filters
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInstances.map((instance) => (
              <InstanceGridCard
                key={instance.id}
                instance={instance}
                onEdit={handleEditInstance}
                onDelete={handleDeleteInstance}
                onTest={handleTestConnection}
              />
            ))}
          </div>
        ) : (
          // Table View
          <InstanceTableView
            instances={filteredInstances}
            selectedIds={selectedIds}
            onToggleSelection={handleToggleSelection}
            onSelectAll={handleSelectAll}
            onEdit={handleEditInstance}
            onDelete={handleDeleteInstance}
            onTest={handleTestConnection}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(field) => {
              if (sortBy === field) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(field as any);
                setSortOrder('asc');
              }
            }}
          />
        )}

        {/* Info Card */}
        {instances.length > 0 && (
          <div className="mt-8 bg-primary/5 border border-primary/20 rounded-lg p-6">
            <h3 className="font-semibold mb-2">💡 Remote Admin API</h3>
            <p className="text-sm text-muted-foreground">
              To connect remote instances, ensure the Caddy Admin API is
              accessible and properly secured with mTLS or authentication. By
              default, the Admin API listens on localhost:2019.
            </p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddInstanceDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={createInstance}
        existingInstances={instances}
      />

      {editingInstance && (
        <EditInstanceDialog
          open={!!editingInstance}
          onOpenChange={(open) => !open && setEditingInstance(null)}
          instance={editingInstance}
          onSubmit={updateInstance}
          existingInstances={instances}
        />
      )}

      {deletingInstance && (
        <DeleteInstanceDialog
          open={!!deletingInstance}
          onOpenChange={(open) => !open && setDeletingInstance(null)}
          instance={deletingInstance}
          onConfirm={deleteInstance}
        />
      )}

      {testingInstance && (
        <TestConnectionDialog
          open={!!testingInstance}
          onOpenChange={(open) => !open && setTestingInstance(null)}
          instance={testingInstance}
          onTest={testConnection}
        />
      )}
    </div>
  );
};

export default Instances;
