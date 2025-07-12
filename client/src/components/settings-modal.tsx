import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Edit, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertDeviceSchema } from "@shared/schema";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { Device, InsertDevice } from "@shared/schema";
import { z } from "zod";

const deviceFormSchema = insertDeviceSchema;
type DeviceFormData = z.infer<typeof deviceFormSchema>;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
}

// Define variants using class-variance-authority
const formInputVariants = cva("", {
  variants: {
    error: {
      true: "form-input-error",
      false: "",
    },
  },
  defaultVariants: {
    error: false,
  },
});

const deviceTypeIconVariants = cva("text-brand-blue", {
  variants: {
    type: {
      refrigerator: "text-brand-blue",
      freezer: "text-brand-sky",
    },
  },
  defaultVariants: {
    type: "refrigerator",
  },
});

export default function SettingsModal({ isOpen, onClose, devices }: SettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDevice, setShowAddDevice] = useState(false);
  
  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      name: "",
      type: "",
    },
  });

  const createDeviceMutation = useMutation({
    mutationFn: async (data: InsertDevice) => {
      const response = await apiRequest('POST', '/api/devices', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      toast({
        title: "Device added",
        description: "The device has been added successfully.",
      });
      form.reset();
      setShowAddDevice(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add the device. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      toast({
        title: "Device deleted",
        description: "The device has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the device. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DeviceFormData) => {
    createDeviceMutation.mutate(data);
  };

  const handleDeleteDevice = (id: number) => {
    if (window.confirm("Are you sure you want to delete this device? This action cannot be undone.")) {
      deleteDeviceMutation.mutate(id);
    }
  };

  const handleClose = () => {
    form.reset();
    setShowAddDevice(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-3">Device Management</h4>
            <div className="space-y-3">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={cn(deviceTypeIconVariants({ type: device.type as any }))}>
                      {device.type === 'refrigerator' ? '❄️' : '🧊'}
                    </div>
                    <span className="font-medium text-slate-900">{device.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-brand-blue"
                      onClick={() => {
                        toast({
                          title: "Edit feature coming soon",
                          description: "Device editing will be available in the next update.",
                        });
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-brand-expired"
                      onClick={() => handleDeleteDevice(device.id)}
                      disabled={deleteDeviceMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {showAddDevice ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-3 space-y-3 p-3 bg-slate-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="deviceName">Device Name *</Label>
                  <Input
                    id="deviceName"
                    {...form.register("name")}
                    placeholder="Enter device name"
                    className={cn(formInputVariants({ error: !!form.formState.errors.name }))}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deviceType">Device Type *</Label>
                  <Select onValueChange={(value) => form.setValue("type", value)}>
                    <SelectTrigger className={cn(formInputVariants({ error: !!form.formState.errors.type }))}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refrigerator">Refrigerator</SelectItem>
                      <SelectItem value="freezer">Freezer</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.type && (
                    <p className="text-sm text-red-600">{form.formState.errors.type.message}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="flex-1"
                    disabled={createDeviceMutation.isPending}
                  >
                    {createDeviceMutation.isPending ? "Adding..." : "Add Device"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setShowAddDevice(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                className="mt-3 w-full"
                onClick={() => setShowAddDevice(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Device
              </Button>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-3">Display Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-slate-700">Default items to show</Label>
                <Select defaultValue="10">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm text-slate-700">Expiration warning days</Label>
                <Input 
                  type="number" 
                  defaultValue="3" 
                  min="1" 
                  max="7" 
                  className="w-20"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-200">
          <Button variant="outline" className="w-full" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
