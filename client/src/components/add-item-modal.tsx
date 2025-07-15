import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertInventoryItemSchema } from "@shared/schema";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
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

export default function AddItemModal({ isOpen, onClose, devices }: AddItemModalProps) {
  const { t } = useTranslation(['inventory', 'common']);
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

  // Set default device when devices are loaded or modal opens
  useEffect(() => {
    if (devices.length > 0 && isOpen) {
      form.setValue('deviceId', devices[0].id);
    }
  }, [devices, isOpen, form]);

  const createItemMutation = useMutation({
    mutationFn: async (data: InsertInventoryItem) => {
      const response = await apiRequest('POST', '/api/inventory', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: t('toast.itemAdded.title'),
        description: t('toast.itemAdded.description'),
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: t('toast.error.title'),
        description: t('toast.error.addFailed'),
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
          <DialogTitle>{t('addModal.title')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('common:labels.name')} *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder={t('common:placeholders.enterItemName')}
              className={cn(formInputVariants({ error: !!form.formState.errors.name }))}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">{t('common:labels.category')} *</Label>
            <Select 
              value={form.watch("category") || ""} 
              onValueChange={(value) => form.setValue("category", value)}
            >
              <SelectTrigger className={cn(formInputVariants({ error: !!form.formState.errors.category }))}>
                <SelectValue placeholder={t('common:placeholders.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meat">{t('common:categories.meat')}</SelectItem>
                <SelectItem value="cocktail">{t('common:categories.cocktail')}</SelectItem>
                <SelectItem value="fruit-veg">{t('common:categories.fruitVeg')}</SelectItem>
                <SelectItem value="prepared">{t('common:categories.prepared')}</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity">{t('common:labels.quantity')} *</Label>
            <Input
              id="quantity"
              {...form.register("quantity")}
              placeholder="e.g., 2 containers, 1.5 lbs"
              className={cn(formInputVariants({ error: !!form.formState.errors.quantity }))}
            />
            {form.formState.errors.quantity && (
              <p className="text-sm text-red-600">{form.formState.errors.quantity.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deviceId">{t('common:labels.device')} *</Label>
            <Select 
              value={form.watch("deviceId")?.toString() || ""} 
              onValueChange={(value) => form.setValue("deviceId", parseInt(value))}
            >
              <SelectTrigger className={cn(formInputVariants({ error: !!form.formState.errors.deviceId }))}>
                <SelectValue placeholder={t('common:placeholders.selectDevice')} />
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
            <Label htmlFor="dateAdded">{t('common:labels.dateAdded')}</Label>
            <Input
              id="dateAdded"
              type="date"
              {...form.register("dateAdded")}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expirationDate">{t('common:labels.expirationDate')}</Label>
            <Input
              id="expirationDate"
              type="date"
              {...form.register("expirationDate")}
            />
            <p className="text-xs text-slate-500">{t('addModal.helpText')}</p>
          </div>
          
          <div className="flex items-center space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createItemMutation.isPending}
            >
              {createItemMutation.isPending ? t('common:status.loading') : t('common:buttons.add') + ' Item'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={handleClose}
            >
              {t('common:buttons.cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
