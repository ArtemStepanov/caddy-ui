import { cn } from '@/lib/utils';
import type { SettingsSection, SettingsSectionInfo } from '@/types';
import {
  Settings,
  Palette,
  Server,
  Radio,
  Code,
  Bell,
  Shield,
  Wrench,
  Info,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const SECTIONS: SettingsSectionInfo[] = [
  {
    id: 'general',
    label: 'General',
    icon: 'Settings',
    description: 'Appearance and dashboard preferences',
  },
  {
    id: 'orchestrator',
    label: 'Orchestrator',
    icon: 'Server',
    description: 'Backend and storage configuration',
  },
  {
    id: 'instances',
    label: 'Instances',
    icon: 'Radio',
    description: 'Default connection settings',
  },
  {
    id: 'editor',
    label: 'Editor',
    icon: 'Code',
    description: 'Code editor preferences',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'Bell',
    description: 'Alerts and notifications',
  },
  {
    id: 'security',
    label: 'Security',
    icon: 'Shield',
    description: 'Authentication and audit log',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: 'Wrench',
    description: 'Developer mode and features',
  },
  {
    id: 'about',
    label: 'About',
    icon: 'Info',
    description: 'Version and system info',
  },
];

const ICON_MAP = {
  Settings,
  Palette,
  Server,
  Radio,
  Code,
  Bell,
  Shield,
  Wrench,
  Info,
};

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

export const SettingsSidebar = ({
  activeSection,
  onSectionChange,
}: SettingsSidebarProps) => {
  return (
    <div className="w-64 border-r border-border bg-card/30 backdrop-blur">
      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <div className="p-4 space-y-1">
          {SECTIONS.map((section) => {
            const Icon = ICON_MAP[section.icon as keyof typeof ICON_MAP];
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-lg transition-all',
                  'hover:bg-muted/50 group relative',
                  isActive && 'bg-primary/10 text-primary font-medium'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('w-4 h-4', isActive && 'text-primary')} />
                  <span className="flex-1 text-sm">{section.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
