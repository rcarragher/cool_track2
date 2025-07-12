import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Edit, Trash2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { InventoryItem, Device } from "@shared/schema";

interface InventoryTableProps {
  items: InventoryItem[];
  totalItems: number;
  displayLimit: number;
  devices: Device[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedDevice?: number | null;
  onDeviceFilterChange?: (deviceId: number | null) => void;
}

// Define variants using class-variance-authority
const categoryBadgeVariants = cva("", {
  variants: {
    category: {
      meat: "badge-category-meat",
      cocktail: "badge-category-cocktail",
      "fruit-veg": "badge-category-fruit-veg",
      prepared: "badge-category-prepared",
      default: "bg-gray-100 text-gray-800",
    },
  },
  defaultVariants: {
    category: "default",
  },
});

const expirationBadgeVariants = cva("", {
  variants: {
    status: {
      expired: "badge-status-expired",
      warning: "badge-status-warning",
      good: "badge-status-good",
      none: "badge-status-none",
    },
  },
  defaultVariants: {
    status: "none",
  },
});

const deviceIndicatorVariants = cva("w-2 h-2 rounded-full", {
  variants: {
    type: {
      refrigerator: "bg-blue-500",
      freezer: "bg-purple-500",
    },
  },
  defaultVariants: {
    type: "refrigerator",
  },
});

export default function InventoryTable({
  items,
  totalItems,
  displayLimit,
  devices,
  searchQuery = "",
  onSearchChange,
  selectedDevice = null,
  onDeviceFilterChange,
}: InventoryTableProps) {
  const { t } = useTranslation(['inventory', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: t('inventory:toast.itemDeleted.title'),
        description: t('inventory:toast.itemDeleted.description'),
      });
    },
    onError: () => {
      toast({
        title: t('inventory:toast.error.title'),
        description: t('inventory:toast.error.deleteFailed'),
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm(t('inventory:confirmations.deleteItem'))) {
      deleteItemMutation.mutate(id);
    }
  };

  const getCategoryName = (category: string) => {
    switch (category.toLowerCase()) {
      case 'meat':
        return t('common:categories.meat');
      case 'cocktail':
        return t('common:categories.cocktail');
      case 'fruit-veg':
        return t('common:categories.fruitVeg');
      case 'prepared':
        return t('common:categories.prepared');
      default:
        return category;
    }
  };

  const getExpirationStatus = (expirationDate: string | null) => {
    if (!expirationDate) {
      return { 
        text: t('common:status.noExpiration'), 
        status: 'none' as const 
      };
    }
    
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { 
        text: t('inventory:expiration.expiredDays', { days: Math.abs(diffDays) }), 
        status: 'expired' as const 
      };
    } else if (diffDays <= 3) {
      return { 
        text: t('inventory:expiration.expiresIn', { days: diffDays }), 
        status: 'warning' as const 
      };
    } else {
      return { 
        text: t('inventory:expiration.expiresOn', { date: expDate.toLocaleDateString() }), 
        status: 'good' as const 
      };
    }
  };

  const getDeviceName = (deviceId: number) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : t('inventory:fallbacks.unknownDevice');
  };

  const getDeviceType = (deviceId: number) => {
    const device = devices.find(d => d.id === deviceId);
    return device?.type === 'refrigerator' ? 'refrigerator' : 'freezer';
  };

  return (
    <section>
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{t('inventory:title')}</h3>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className={cn(deviceIndicatorVariants({ type: 'refrigerator' }))}></div>
                  <span className="text-sm text-slate-600">{t('inventory:table.legend.refrigerator')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={cn(deviceIndicatorVariants({ type: 'freezer' }))}></div>
                  <span className="text-sm text-slate-600">{t('inventory:table.legend.freezer')}</span>
                </div>
              </div>
            </div>
            
            {/* Search and Filter Controls */}
            {(onSearchChange || onDeviceFilterChange) && (
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {onSearchChange && (
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder={t('common:placeholders.searchItems')}
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}
                
                {onDeviceFilterChange && devices.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm text-slate-600 whitespace-nowrap">{t('inventory:filters.filterByDevice')}</span>
                    <Select 
                      value={selectedDevice?.toString() || "all"} 
                      onValueChange={(value) => onDeviceFilterChange(value === "all" ? null : parseInt(value))}
                    >
                      <SelectTrigger className="w-full sm:w-48 text-left">
                        <SelectValue placeholder={t('inventory:filters.allDevices')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('inventory:filters.allDevices')}</SelectItem>
                        {devices.map(device => (
                          <SelectItem key={device.id} value={device.id.toString()}>
                            {device.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-slate-400 text-2xl">📦</div>
              </div>
              <h4 className="text-lg font-medium text-slate-900 mb-2">{t('inventory:table.emptyState.title')}</h4>
              <p className="text-slate-600">{t('inventory:table.emptyState.description')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">{t('inventory:table.headers.item')}</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">{t('inventory:table.headers.category')}</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">{t('inventory:table.headers.quantity')}</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">{t('inventory:table.headers.added')}</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">{t('inventory:table.headers.expires')}</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">{t('inventory:table.headers.device')}</th>
                      <th className="text-right py-3 px-6 text-sm font-medium text-slate-600">{t('inventory:table.headers.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item) => {
                      const expirationStatus = getExpirationStatus(item.expirationDate);
                      const deviceType = getDeviceType(item.deviceId);
                      
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className={cn(deviceIndicatorVariants({ type: deviceType }))}></div>
                              <span className="font-medium text-slate-900">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={cn(categoryBadgeVariants({ category: item.category as any }))}>
                              {getCategoryName(item.category)}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600">{item.quantity}</td>
                          <td className="py-4 px-6 text-sm text-slate-600">
                            {new Date(item.dateAdded).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={cn(expirationBadgeVariants({ status: expirationStatus.status }))}>
                              {expirationStatus.text}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600">{getDeviceName(item.deviceId)}</td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-brand-blue"
                                onClick={() => {
                                  // TODO: Implement edit functionality
                                  toast({
                                    title: t('inventory:toast.comingSoon.edit'),
                                    description: t('inventory:toast.comingSoon.editDescription'),
                                  });
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-brand-expired"
                                onClick={() => handleDelete(item.id)}
                                disabled={deleteItemMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
{t('inventory:table.footer.showing', { count: items.length, total: totalItems })}
                  </div>
                  {displayLimit !== -1 && items.length >= displayLimit && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement load more functionality
                          toast({
                            title: t('inventory:toast.comingSoon.loadMore'),
                            description: t('inventory:toast.comingSoon.loadMoreDescription'),
                          });
                        }}
                      >
{t('common:buttons.loadMore')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
