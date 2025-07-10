import { Box, Clock, AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: 'box' | 'clock' | 'warning' | 'plus';
  color: 'blue' | 'warning' | 'expired' | 'gradient';
  subtitle?: string;
  onClick?: () => void;
}

const iconMap = {
  box: Box,
  clock: Clock,
  warning: AlertTriangle,
  plus: Plus,
};

export default function DashboardCard({
  title,
  value,
  icon,
  color,
  subtitle,
  onClick,
}: DashboardCardProps) {
  const IconComponent = iconMap[icon];

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md group",
        color === 'gradient' && "bg-gradient-to-br from-[hsl(207,90%,54%)] to-[hsl(200,98%,39%)] text-white"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={cn(
              "text-sm font-medium mb-1",
              color === 'gradient' ? "text-blue-100" : "text-slate-600"
            )}>
              {title}
            </p>
            <p className={cn(
              "text-3xl font-bold",
              color === 'blue' && "text-slate-900",
              color === 'warning' && "text-brand-warning",
              color === 'expired' && "text-brand-expired",
              color === 'gradient' && "text-white"
            )}>
              {value}
            </p>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
            color === 'blue' && "bg-brand-blue bg-opacity-10 group-hover:bg-opacity-20",
            color === 'warning' && "bg-brand-warning bg-opacity-10 group-hover:bg-opacity-20",
            color === 'expired' && "bg-brand-expired bg-opacity-10 group-hover:bg-opacity-20",
            color === 'gradient' && "bg-white bg-opacity-20 group-hover:bg-opacity-30"
          )}>
            <IconComponent className={cn(
              "w-6 h-6",
              color === 'blue' && "text-brand-blue",
              color === 'warning' && "text-brand-warning",
              color === 'expired' && "text-brand-expired",
              color === 'gradient' && "text-white"
            )} />
          </div>
        </div>
        <div className={cn(
          "mt-4 flex items-center text-sm",
          color === 'gradient' ? "text-blue-100" : "text-slate-600"
        )}>
          <ArrowRight className="w-4 h-4 mr-2" />
          <span>{subtitle || "View details"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
