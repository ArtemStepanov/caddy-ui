import { ArrowUpDown, MoreVertical, Settings, Trash2, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CaddyInstance } from "@/lib/api-client";
import { getStatusConfig, mapInstanceStatus, formatLastSeen } from "@/lib/instance-utils";
import { cn } from "@/lib/utils";

interface InstanceTableViewProps {
  instances: CaddyInstance[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (instance: CaddyInstance) => void;
  onDelete: (instance: CaddyInstance) => void;
  onTest: (instance: CaddyInstance) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export function InstanceTableView({
  instances,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  onEdit,
  onDelete,
  onTest,
  sortBy,
  sortOrder,
  onSort,
}: InstanceTableViewProps) {
  const allSelected = instances.length > 0 && selectedIds.length === instances.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(field)}
      className="h-8 gap-1"
    >
      {children}
      <ArrowUpDown className={cn(
        "w-3 h-3",
        sortBy === field ? "text-primary" : "text-muted-foreground"
      )} />
    </Button>
  );

  return (
    <div className="rounded-lg border border-border bg-card/50 backdrop-blur overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all"
                className={someSelected ? "opacity-50" : ""}
              />
            </TableHead>
            <TableHead className="w-16">Status</TableHead>
            <TableHead>
              <SortButton field="name">Name</SortButton>
            </TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Auth</TableHead>
            <TableHead>
              <SortButton field="last_seen">Last Seen</SortButton>
            </TableHead>
            <TableHead className="w-20 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instances.map((instance) => {
            const status = mapInstanceStatus(instance.status);
            const statusConfig = getStatusConfig(status);
            const isSelected = selectedIds.includes(instance.id);

            return (
              <TableRow
                key={instance.id}
                className={cn(
                  "border-border",
                  isSelected && "bg-primary/5"
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelection(instance.id)}
                    aria-label={`Select ${instance.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className={cn("w-2 h-2 rounded-full", statusConfig.dotColor)} />
                      {statusConfig.pulse && (
                        <div className={cn(
                          "absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-75",
                          statusConfig.dotColor
                        )} />
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{instance.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {instance.admin_url}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {instance.auth_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatLastSeen(instance.last_seen)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem onClick={() => onEdit(instance)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTest(instance)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Health Check
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(instance)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="border-t border-border bg-primary/5 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedIds.length} instance{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Health Check All
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-1" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
