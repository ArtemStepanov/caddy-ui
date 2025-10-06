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
      <div className="opacity-60 pointer-events-none">
        {children}
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-background/20 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground/60">
          <Construction className="w-12 h-12" />
          <div className="text-lg font-medium">Work in Progress</div>
          <div className="text-sm">This section is under development</div>
        </div>
      </div>
    </div>
  );
};

