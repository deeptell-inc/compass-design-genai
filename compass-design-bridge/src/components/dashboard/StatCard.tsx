
import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  loading?: boolean;
}

const StatCard = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
  loading = false,
}: StatCardProps) => {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-16 mb-2" />
            {description && <Skeleton className="h-3 w-20 mb-2" />}
            <Skeleton className="h-3 w-12" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <div
                className={cn(
                  "flex items-center mt-2 text-xs",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                <span>
                  {trend.isPositive ? "+" : "-"}
                  {Math.abs(trend.value)}%
                </span>
                <span className="ml-1">前期比</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
