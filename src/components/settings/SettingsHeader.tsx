import { Button } from '@/components/ui/button';
import { Settings, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface SettingsHeaderProps {
  onExport: () => void;
  onReset: () => void;
}

export const SettingsHeader = ({ onExport, onReset }: SettingsHeaderProps) => {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Configure Caddy Orchestrator and user preferences
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Press{' '}
            <Badge variant="outline" className="text-xs">
              Cmd
            </Badge>{' '}
            +{' '}
            <Badge variant="outline" className="text-xs">
              K
            </Badge>{' '}
            to search
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Export Settings</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport()}>
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport()}>
              Export as YAML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="destructive" onClick={onReset}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};
