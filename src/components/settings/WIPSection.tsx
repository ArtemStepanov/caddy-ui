import type { ReactNode } from 'react';
import { Construction } from 'lucide-react';

interface WIPSectionProps {
  isWIP?: boolean;
  children: ReactNode;
}

export const WIPSection = ({ isWIP = false, children }: WIPSectionProps) => {
  if (!isWIP) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="opacity-60 pointer-events-none select-none">
        {children}
      </div>
      
      <div className="absolute inset-0 flex items-start justify-center bg-background/20 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-3">
          <Construction className="w-12 h-12 text-muted-foreground" />
          <div className="text-lg font-medium text-muted-foreground">Work in Progress</div>
          <div className="text-sm text-muted-foreground">This section is under development</div>
        </div>
      </div>
    </div>
  );
};
