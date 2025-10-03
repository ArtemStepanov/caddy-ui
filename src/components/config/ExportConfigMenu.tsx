import { Download, Copy, FileJson, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { ExportConfigMenuProps } from '@/types';

export function ExportConfigMenu({
  jsonConfig,
  caddyfileConfig,
  instanceName,
}: ExportConfigMenuProps) {
  const { toast } = useToast();

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Configuration Exported',
      description: `Downloaded as ${filename}`,
    });
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: 'Copied to Clipboard',
        description: 'Configuration has been copied',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const formatInstanceName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() =>
            downloadFile(jsonConfig, `${formatInstanceName(instanceName)}-config.json`)
          }
        >
          <FileJson className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        {caddyfileConfig && (
          <DropdownMenuItem
            onClick={() =>
              downloadFile(caddyfileConfig, `${formatInstanceName(instanceName)}.caddyfile`)
            }
          >
            <FileText className="w-4 h-4 mr-2" />
            Export as Caddyfile
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => copyToClipboard(jsonConfig)}>
          <Copy className="w-4 h-4 mr-2" />
          Copy to Clipboard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
