import { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { SettingsSection } from '@/types';
import {
  Settings,
  Server,
  Radio,
  Code,
  Bell,
  Shield,
  Wrench,
  Info,
} from 'lucide-react';

interface SearchableItem {
  section: SettingsSection;
  category: string;
  label: string;
  description: string;
  keywords: string[];
}

const SEARCHABLE_ITEMS: SearchableItem[] = [
  // General
  {
    section: 'general',
    category: 'General',
    label: 'Theme',
    description: 'Change light/dark theme',
    keywords: ['theme', 'dark', 'light', 'appearance', 'color'],
  },
  {
    section: 'general',
    category: 'General',
    label: 'Language',
    description: 'Interface language',
    keywords: ['language', 'locale', 'translation'],
  },
  {
    section: 'general',
    category: 'General',
    label: 'Date Format',
    description: 'Date and time format',
    keywords: ['date', 'time', 'format', 'timestamp'],
  },
  {
    section: 'general',
    category: 'General',
    label: 'Refresh Interval',
    description: 'Auto-refresh frequency',
    keywords: ['refresh', 'interval', 'polling', 'update'],
  },
  {
    section: 'general',
    category: 'General',
    label: 'Display Density',
    description: 'Compact, comfortable, or spacious',
    keywords: ['density', 'spacing', 'compact', 'layout'],
  },

  // Orchestrator
  {
    section: 'orchestrator',
    category: 'Orchestrator',
    label: 'Backend URL',
    description: 'API server connection',
    keywords: ['backend', 'api', 'url', 'server', 'connection'],
  },
  {
    section: 'orchestrator',
    category: 'Orchestrator',
    label: 'API Timeout',
    description: 'Request timeout settings',
    keywords: ['timeout', 'api', 'request', 'wait'],
  },
  {
    section: 'orchestrator',
    category: 'Orchestrator',
    label: 'Auto-save',
    description: 'Automatic settings save',
    keywords: ['autosave', 'save', 'automatic', 'backup'],
  },

  // Instances
  {
    section: 'instances',
    category: 'Instances',
    label: 'Default Timeout',
    description: 'Connection timeout',
    keywords: ['timeout', 'instance', 'connection'],
  },
  {
    section: 'instances',
    category: 'Instances',
    label: 'Health Checks',
    description: 'Instance monitoring',
    keywords: ['health', 'check', 'monitoring', 'status'],
  },

  // Editor
  {
    section: 'editor',
    category: 'Editor',
    label: 'Font',
    description: 'Editor font settings',
    keywords: ['font', 'typeface', 'size', 'editor'],
  },
  {
    section: 'editor',
    category: 'Editor',
    label: 'Tab Settings',
    description: 'Indentation preferences',
    keywords: ['tab', 'indent', 'spaces', 'formatting'],
  },
  {
    section: 'editor',
    category: 'Editor',
    label: 'Validation',
    description: 'Live code validation',
    keywords: ['validation', 'lint', 'check', 'syntax'],
  },

  // Notifications
  {
    section: 'notifications',
    category: 'Notifications',
    label: 'Browser Notifications',
    description: 'Desktop notifications',
    keywords: ['notification', 'alert', 'browser', 'desktop'],
  },
  {
    section: 'notifications',
    category: 'Notifications',
    label: 'Sound',
    description: 'Notification sounds',
    keywords: ['sound', 'audio', 'volume', 'notification'],
  },

  // Security
  {
    section: 'security',
    category: 'Security',
    label: 'Audit Logging',
    description: 'Activity tracking',
    keywords: ['audit', 'log', 'history', 'tracking'],
  },
  {
    section: 'security',
    category: 'Security',
    label: 'Session Timeout',
    description: 'Auto-logout settings',
    keywords: ['session', 'timeout', 'logout', 'expiry'],
  },

  // Advanced
  {
    section: 'advanced',
    category: 'Advanced',
    label: 'Developer Mode',
    description: 'Debug and developer tools',
    keywords: ['developer', 'debug', 'console', 'dev'],
  },
  {
    section: 'advanced',
    category: 'Advanced',
    label: 'Cache Strategy',
    description: 'Data caching behavior',
    keywords: ['cache', 'storage', 'performance'],
  },
  {
    section: 'advanced',
    category: 'Advanced',
    label: 'Experimental Features',
    description: 'Beta functionality',
    keywords: ['experimental', 'beta', 'feature', 'flags'],
  },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  General: Settings,
  Orchestrator: Server,
  Instances: Radio,
  Editor: Code,
  Notifications: Bell,
  Security: Shield,
  Advanced: Wrench,
  About: Info,
};

interface SettingsSearchProps {
  onNavigate: (section: SettingsSection) => void;
}

export const SettingsSearch = ({ onNavigate }: SettingsSearchProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (section: SettingsSection) => {
    setOpen(false);
    onNavigate(section);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search settings..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(
          SEARCHABLE_ITEMS.reduce((acc, item) => {
            if (!acc[item.category]) {
              acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
          }, {} as Record<string, SearchableItem[]>)
        ).map(([category, items]) => {
          const Icon = ICON_MAP[category];
          return (
            <CommandGroup key={category} heading={category}>
              {items.map((item, index) => (
                <CommandItem
                  key={`${item.section}-${index}`}
                  value={`${item.label} ${item.description} ${item.keywords.join(' ')}`}
                  onSelect={() => handleSelect(item.section)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
};
