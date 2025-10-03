import { Card, CardContent } from "@/components/ui/card";
import type { StatsCardProps } from "@/types";

export function StatsCard({ title, value, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <p
                className={`text-sm mt-2 ${
                  trend.positive ? "text-success" : "text-destructive"
                }`}
              >
                {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
