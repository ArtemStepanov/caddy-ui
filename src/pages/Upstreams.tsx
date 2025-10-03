import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstances } from "@/hooks/useInstances";
import { useUpstreams, useTestUpstreamHealth } from "@/hooks/useUpstreams";
import type { Upstream, UpstreamPool } from "@/types/api";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Grid3x3,
  List,
  RefreshCw,
  Search,
  TrendingDown,
  XCircle,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { HealthCheckModal, PoolSection, UpstreamDetailsDrawer, UpstreamsEmptyState } from "@/components/upstreams";
import { InstanceSelector } from "@/components/instances";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type ViewMode = 'grouped' | 'flat';
type FilterTab = 'all' | 'healthy' | 'unhealthy' | 'slow';
type SortBy = 'status' | 'response-time' | 'name';

const Upstreams = () => {
  // State
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortBy>('status');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30000); // 30 seconds
  const [selectedUpstream, setSelectedUpstream] = useState<Upstream | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [healthCheckModalOpen, setHealthCheckModalOpen] = useState(false);
  const [upstreamsToTest, setUpstreamsToTest] = useState<Upstream[]>([]);

  // Hooks
  const { instances, loading: instancesLoading } = useInstances();
  
  const { data: upstreamsData, isLoading, error, refresh } = useUpstreams(
    selectedInstanceId,
    autoRefreshInterval > 0 ? autoRefreshInterval : undefined
  );
  
  const testHealthMutation = useTestUpstreamHealth(selectedInstanceId || '');

  // Auto-select first instance if none selected (only on initial load)
  useEffect(() => {
    if (!selectedInstanceId && instances.length > 0) {
      setSelectedInstanceId(instances[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instances.length]); // Only re-run when number of instances changes

  // Filtered and sorted upstreams
  const { filteredPools, allUpstreams } = useMemo(() => {
    if (!upstreamsData) return { filteredPools: [], allUpstreams: [] };

    const pools = upstreamsData.pools || [];
    const all: Upstream[] = [];

    pools.forEach(pool => {
      pool.upstreams.forEach(upstream => all.push(upstream));
    });

    // Apply search filter
    let filtered = all;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        (u.address?.toLowerCase().includes(query)) ||
        (u.dial?.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filterTab !== 'all') {
      filtered = filtered.filter(u => {
        if (filterTab === 'healthy') return u.status === 'healthy';
        if (filterTab === 'unhealthy') return u.status === 'unhealthy';
        if (filterTab === 'slow') return u.response_time && u.response_time > 500;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'status') {
        const statusOrder = { unhealthy: 0, degraded: 1, healthy: 2, unknown: 3 };
        return (statusOrder[a.status || 'unknown'] || 3) - (statusOrder[b.status || 'unknown'] || 3);
      }
      if (sortBy === 'response-time') {
        return (b.response_time || 0) - (a.response_time || 0);
      }
      if (sortBy === 'name') {
        return (a.address || a.dial || '').localeCompare(b.address || b.dial || '');
      }
      return 0;
    });

    // Re-group filtered upstreams into pools if needed
    const filteredPoolsResult = pools.map(pool => ({
      ...pool,
      upstreams: pool.upstreams.filter(u => filtered.includes(u))
    })).filter(pool => pool.upstreams.length > 0);

    return { filteredPools: filteredPoolsResult, allUpstreams: filtered };
  }, [upstreamsData, searchQuery, filterTab, sortBy]);

  // Handlers
  const handleViewDetails = (upstream: Upstream) => {
    setSelectedUpstream(upstream);
    setDetailsDrawerOpen(true);
  };

  const handleTestHealth = (upstream?: Upstream) => {
    if (upstream) {
      setUpstreamsToTest([upstream]);
    } else if (upstreamsData) {
      setUpstreamsToTest(allUpstreams);
    }
    setHealthCheckModalOpen(true);
  };

  const handleRefreshAll = () => {
    refresh();
    toast.success('Refreshing upstreams data...');
  };

  const handleHealthCheckComplete = () => {
    refresh();
  };

  // Loading state
  if (isLoading && !upstreamsData) {
    return (
      <div className="min-h-screen bg-gradient-dark p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-dark p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-destructive/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-destructive">
                <XCircle className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">Failed to load upstreams</h3>
                  <p className="text-sm">{error.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = upstreamsData || {
    total_upstreams: 0,
    healthy: 0,
    unhealthy: 0,
    degraded: 0,
    avg_response_time: 0,
  };

  const hasUpstreams = stats.total_upstreams > 0;
  const selectedInstance = instances.find(i => i.id === selectedInstanceId);

  return (
    <div className="min-h-screen bg-gradient-dark p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              Upstreams
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor reverse proxy backends and health status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefreshAll}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleTestHealth()}
              disabled={!hasUpstreams}
            >
              <Activity className="w-4 h-4 mr-2" />
              Health Check
            </Button>
            <Select 
              value={autoRefreshInterval.toString()} 
              onValueChange={(v) => setAutoRefreshInterval(Number(v))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Auto-refresh: Off</SelectItem>
                <SelectItem value="10000">Auto-refresh: 10s</SelectItem>
                <SelectItem value="30000">Auto-refresh: 30s</SelectItem>
                <SelectItem value="60000">Auto-refresh: 1min</SelectItem>
                <SelectItem value="300000">Auto-refresh: 5min</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Instance Selector */}
        <InstanceSelector
          instances={instances}
          selectedInstanceId={selectedInstanceId}
          onInstanceChange={setSelectedInstanceId}
          loading={instancesLoading}
          showStatusBadge={true}
        />

        {/* No instance selected */}
        {!selectedInstanceId && !instancesLoading && instances.length === 0 && (
          <UpstreamsEmptyState type="no-instance" />
        )}

        {/* No upstreams configured */}
        {selectedInstanceId && !hasUpstreams && !isLoading && (
          <UpstreamsEmptyState type="no-reverse-proxy" onRefresh={handleRefreshAll} />
        )}

        {/* Stats Cards */}
        {selectedInstanceId && hasUpstreams && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Upstreams"
                value={stats.total_upstreams}
                icon={<Activity className="w-8 h-8 text-primary" />}
                badge={`in ${filteredPools.length} ${filteredPools.length === 1 ? 'pool' : 'pools'}`}
              />
              <StatsCard
                title="Healthy"
                value={stats.healthy}
                icon={<CheckCircle className="w-8 h-8 text-green-500" />}
                subtitle={`${Math.round((stats.healthy / stats.total_upstreams) * 100)}%`}
                valueColor="text-green-500"
              />
              <StatsCard
                title="Unhealthy"
                value={stats.unhealthy}
                icon={<XCircle className="w-8 h-8 text-red-500" />}
                subtitle={`${Math.round((stats.unhealthy / stats.total_upstreams) * 100)}%`}
                valueColor="text-red-500"
              />
              <StatsCard
                title="Avg Response Time"
                value={`${Math.round(stats.avg_response_time)}ms`}
                icon={<Clock className="w-8 h-8 text-blue-500" />}
                trend={<TrendingDown className="w-4 h-4 text-green-500" />}
              />
            </div>

            {/* All healthy banner */}
            {stats.unhealthy === 0 && stats.degraded === 0 && (
              <UpstreamsEmptyState type="all-healthy" onRefresh={handleRefreshAll} />
            )}

            {/* Filters and View Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as FilterTab)} className="flex-1">
                <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                  <TabsTrigger value="all" className="gap-2">
                    All
                    <Badge variant="secondary" className="ml-1">{stats.total_upstreams}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="healthy" className="gap-2">
                    Healthy
                    <Badge variant="secondary" className="ml-1 bg-green-500/10 text-green-500">{stats.healthy}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="unhealthy" className="gap-2">
                    Unhealthy
                    <Badge variant="secondary" className="ml-1 bg-red-500/10 text-red-500">{stats.unhealthy}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="slow" className="gap-2">
                    Slow
                    <Badge variant="secondary" className="ml-1 bg-yellow-500/10 text-yellow-500">
                      {allUpstreams.filter(u => u.response_time && u.response_time > 500).length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grouped' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grouped')}
                >
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  Group by Pool
                </Button>
                <Button
                  variant={viewMode === 'flat' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('flat')}
                >
                  <List className="w-4 h-4 mr-2" />
                  Flat List
                </Button>
              </div>
            </div>

            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by upstream URL or pool name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Sort by: Health Status</SelectItem>
                  <SelectItem value="response-time">Sort by: Response Time</SelectItem>
                  <SelectItem value="name">Sort by: Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Upstreams Display */}
            {viewMode === 'grouped' ? (
              <div className="space-y-4">
                {filteredPools.map(pool => (
                  <PoolSection
                    key={pool.id}
                    pool={pool}
                    onViewDetails={handleViewDetails}
                    onTestHealth={handleTestHealth}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-card/50 backdrop-blur border-border">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Upstream URL</TableHead>
                        <TableHead>Pool</TableHead>
                        <TableHead>Response Time</TableHead>
                        <TableHead>Requests</TableHead>
                        <TableHead>Fails</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUpstreams.map((upstream, idx) => {
                        const pool = filteredPools.find(p => p.upstreams.includes(upstream));
                        return (
                          <TableRow key={idx} className="cursor-pointer hover:bg-accent/50" onClick={() => handleViewDetails(upstream)}>
                            <TableCell>
                              <UpstreamStatusBadge status={upstream.status || 'unknown'} />
                            </TableCell>
                            <TableCell className="font-mono text-sm">{upstream.address || upstream.dial}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{pool?.name || 'Default'}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className={getResponseTimeColor(upstream.response_time || 0)}>
                                {upstream.response_time || 0}ms
                              </span>
                            </TableCell>
                            <TableCell>{(upstream.num_requests || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={(upstream.fails || 0) / (upstream.health_checks?.passive?.max_fails || 100) * 100} 
                                  className="w-16 h-2"
                                />
                                <span className="text-sm">{upstream.fails || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTestHealth(upstream);
                                }}
                              >
                                Test
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Details Drawer */}
      <UpstreamDetailsDrawer
        upstream={selectedUpstream}
        instanceId={selectedInstanceId}
        open={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        onTestHealth={handleTestHealth}
      />

      {/* Health Check Modal */}
      <HealthCheckModal
        open={healthCheckModalOpen}
        onClose={() => setHealthCheckModalOpen(false)}
        upstreams={upstreamsToTest}
        onTestComplete={handleHealthCheckComplete}
      />
    </div>
  );
};

function StatsCard({ 
  title, 
  value, 
  icon, 
  subtitle, 
  badge, 
  valueColor, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  subtitle?: string;
  badge?: string;
  valueColor?: string;
  trend?: React.ReactNode;
}) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${valueColor || ''}`}>{value}</p>
              {trend}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {badge && (
              <Badge variant="secondary" className="mt-2 text-xs">{badge}</Badge>
            )}
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function UpstreamStatusBadge({ status }: { status: string }) {
  const config = {
    healthy: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Healthy' },
    degraded: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Degraded' },
    unhealthy: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Unhealthy' },
    unknown: { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'Unknown' },
  };

  const { icon: Icon, color, bg, label } = config[status as keyof typeof config] || config.unknown;

  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <Badge variant="outline" className={`${bg} border-0`}>
        {label}
      </Badge>
    </div>
  );
}

function getResponseTimeColor(ms: number): string {
  if (ms < 100) return 'text-green-500 font-medium';
  if (ms < 500) return 'text-yellow-500 font-medium';
  return 'text-red-500 font-medium';
}

export default Upstreams;
