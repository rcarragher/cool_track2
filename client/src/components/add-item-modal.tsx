import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertInventoryItemSchema } from "@shared/schema";
import type { Device, InsertInventoryItem } from "@shared/schema";
import { z } from "zod";

const formSchema = insertInventoryItemSchema.extend({
  deviceId: z.number().min(1, "Please select a device"),
});

type FormData = z.infer<typeof formSchema>;

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
}

export default function AddItemModal({ isOpen, onClose, devices }: AddItemModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      quantity: "",
      deviceId: 0,
      dateAdded: new Date().toISOString().split('T')[0],
      expirationDate: "",
    },
  });

  // Set default device when devices are loaded
  useEffect(() => {
    if (devices.length > 0 && form.getValues('deviceId') === 0) {
      form.setValue('deviceId', devices[0].id);
    }
  }, [devices, form]);

  const createItemMutation = useMutation({
    mutationFn: async (data: InsertInventoryItem) => {
      const response = await apiRequest('POST', '/api/inventory', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: "Item added",
        description: "The inventory item has been added successfully.",
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add the item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const submitData: InsertInventoryItem = {
      ...data,
      expirationDate: data.expirationDate || null,
    };
    createItemMutation.mutate(submitData);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter item name"
              className={form.formState.errors.name ? "border-red-500" : ""}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select onValueChange={(value) => form.setValue("category", value)}>
              <SelectTrigger className={form.formState.errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meat">Meat</SelectItem>
                <SelectItem value="cocktail">Cocktail Supplies</SelectItem>
                <SelectItem value="fruit-veg">Fruit/Veg</SelectItem>
                <SelectItem value="prepared">Prepared Meals</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              {...form.register("quantity")}
              placeholder="e.g., 2 containers, 1.5 lbs"
              className={form.formState.errors.quantity ? "border-red-500" : ""}
            />
            {form.formState.errors.quantity && (
              <p className="text-sm text-red-600">{form.formState.errors.quantity.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deviceId">Device *</Label>
            <Select onValueChange={(value) => form.setValue("deviceId", parseInt(value))}>
              <SelectTrigger className={form.formState.errors.deviceId ? "border-red-500" : ""}>
                <SelectValue placeholder="Select device" />
              </SelectTrigger>
              <SelectContent>
                {devices.map(device => (
                  <SelectItem key={device.id} value={device.id.toString()}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.deviceId && (
              <p className="text-sm text-red-600">{form.formState.errors.deviceId.message}</p>
            )}
          </div>
          

          
          <div className="space-y-2">
            <Label htmlFor="dateAdded">Date Added</Label>
            <Input
              id="dateAdded"
              type="date"
              {...form.register("dateAdded")}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expirationDate">Expiration Date</Label>
            <Input
              id="expirationDate"
              type="date"
              {...form.register("expirationDate")}
            />
            <p className="text-xs text-slate-500">Optional - leave blank for items that don't expire</p>
          </div>
          
          <div className="flex items-center space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createItemMutation.isPending}
            >
              {createItemMutation.isPending ? "Adding..." : "Add Item"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={handleClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
