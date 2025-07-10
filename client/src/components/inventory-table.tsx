import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InventoryItem, Device } from "@shared/schema";

interface InventoryTableProps {
  items: InventoryItem[];
  totalItems: number;
  displayLimit: number;
  devices: Device[];
}

export default function InventoryTable({
  items,
  totalItems,
  displayLimit,
  devices,
}: InventoryTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: "Item deleted",
        description: "The inventory item has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteItemMutation.mutate(id);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'meat':
        return 'bg-red-100 text-red-800';
      case 'cocktail':
        return 'bg-blue-100 text-blue-800';
      case 'fruit-veg':
        return 'bg-green-100 text-green-800';
      case 'prepared':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExpirationStatus = (expirationDate: string | null) => {
    if (!expirationDate) return { text: 'No expiration', color: 'bg-slate-100 text-slate-800' };
    
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `Expired ${Math.abs(diffDays)} days ago`, color: 'bg-red-100 text-red-800' };
    } else if (diffDays <= 3) {
      return { text: `Expires in ${diffDays} days`, color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: `Expires ${expDate.toLocaleDateString()}`, color: 'bg-green-100 text-green-800' };
    }
  };

  const getDeviceName = (deviceId: number) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : 'Unknown Device';
  };

  const getLocationColor = (location: string) => {
    return location.toLowerCase() === 'refrigerator' ? 'bg-blue-500' : 'bg-purple-500';
  };

  return (
    <section>
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Current Inventory</h3>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Refrigerator</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Freezer</span>
                </div>
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-slate-400 text-2xl">📦</div>
              </div>
              <h4 className="text-lg font-medium text-slate-900 mb-2">No items found</h4>
              <p className="text-slate-600">Your inventory is empty or no items match your search criteria.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Item</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Category</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Quantity</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Added</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Expires</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Location</th>
                      <th className="text-right py-3 px-6 text-sm font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item) => {
                      const expirationStatus = getExpirationStatus(item.expirationDate);
                      
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full ${getLocationColor(item.location)}`}></div>
                              <span className="font-medium text-slate-900">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={getCategoryColor(item.category)}>
                              {item.category}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600">{item.quantity}</td>
                          <td className="py-4 px-6 text-sm text-slate-600">
                            {new Date(item.dateAdded).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={expirationStatus.color}>
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
                                    title: "Edit feature coming soon",
                                    description: "Item editing will be available in the next update.",
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
                    Showing <span className="font-medium">{items.length}</span> of <span className="font-medium">{totalItems}</span> items
                  </div>
                  {displayLimit !== -1 && items.length >= displayLimit && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement load more functionality
                          toast({
                            title: "Load more feature coming soon",
                            description: "Use the display limit selector to show more items.",
                          });
                        }}
                      >
                        Load More
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
