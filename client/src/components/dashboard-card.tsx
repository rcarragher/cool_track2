import { Box, Clock, AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

interface DashboardCardProps extends VariantProps<typeof dashboardCardVariants> {
  title: string;
  value: string | number;
  icon: 'box' | 'clock' | 'warning' | 'plus';
  subtitle?: string;
  onClick?: () => void;
}

const iconMap = {
  box: Box,
  clock: Clock,
  warning: AlertTriangle,
  plus: Plus,
};

// Define variants using class-variance-authority
const dashboardCardVariants = cva(
  "cursor-pointer transition-all duration-200 hover:shadow-md group",
  {
    variants: {
      color: {
        blue: "",
        warning: "",
        expired: "",
        gradient: "bg-gradient-primary text-white",
      },
    },
    defaultVariants: {
      color: "blue",
    },
  }
);

// Separate style variants for different elements
const titleVariants = cva("text-sm font-medium mb-1", {
  variants: {
    color: {
      blue: "text-slate-600",
      warning: "text-slate-600", 
      expired: "text-slate-600",
      gradient: "text-blue-100",
    },
  },
  defaultVariants: {
    color: "blue",
  },
});

const valueVariants = cva("text-3xl font-bold", {
  variants: {
    color: {
      blue: "text-slate-900",
      warning: "text-brand-warning",
      expired: "text-brand-expired", 
      gradient: "text-white",
    },
  },
  defaultVariants: {
    color: "blue",
  },
});

const iconContainerVariants = cva(
  "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
  {
    variants: {
      color: {
        blue: "bg-brand-blue bg-opacity-10 group-hover:bg-opacity-20",
        warning: "bg-brand-warning bg-opacity-10 group-hover:bg-opacity-20",
        expired: "bg-brand-expired bg-opacity-10 group-hover:bg-opacity-20",
        gradient: "bg-white bg-opacity-20 group-hover:bg-opacity-30",
      },
    },
    defaultVariants: {
      color: "blue",
    },
  }
);

const iconVariants = cva("w-6 h-6", {
  variants: {
    color: {
      blue: "text-brand-blue",
      warning: "text-brand-warning",
      expired: "text-brand-expired",
      gradient: "text-white",
    },
  },
  defaultVariants: {
    color: "blue",
  },
});

const subtitleVariants = cva("mt-4 flex items-center text-sm", {
  variants: {
    color: {
      blue: "text-slate-600",
      warning: "text-slate-600",
      expired: "text-slate-600", 
      gradient: "text-blue-100",
    },
  },
  defaultVariants: {
    color: "blue",
  },
});

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
      className={cn(dashboardCardVariants({ color }))}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={cn(titleVariants({ color }))}>
              {title}
            </p>
            <p className={cn(valueVariants({ color }))}>
              {value}
            </p>
          </div>
          <div className={cn(iconContainerVariants({ color }))}>
            <IconComponent className={cn(iconVariants({ color }))} />
          </div>
        </div>
        <div className={cn(subtitleVariants({ color }))}>
          <ArrowRight className="w-4 h-4 mr-2" />
          <span>{subtitle || "View details"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
