import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Snowflake, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import DashboardCard from "@/components/dashboard-card";
import SearchSection from "@/components/search-section";
import InventoryTable from "@/components/inventory-table";
import AddItemModal from "@/components/add-item-modal";
import SettingsModal from "@/components/settings-modal";
import type { Device, InventoryItem } from "@shared/schema";

export default function Dashboard() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'expiring' | 'expired'>('all');

  const { data: devices = [], isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ['/api/devices'],
  });

  const { data: inventoryItems = [], isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory'],
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['/api/settings'],
  });

  // Set default device if not selected
  if (!selectedDeviceId && devices.length > 0) {
    setSelectedDeviceId(devices[0].id);
  }

  // Calculate dashboard stats
  const dashboardStats = useMemo(() => {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    const totalItems = inventoryItems.length;
    
    const expiringSoon = inventoryItems.filter(item => {
      if (!item.expirationDate) return false;
      const expDate = new Date(item.expirationDate);
      return expDate >= today && expDate <= threeDaysFromNow;
    }).length;
    
    const expired = inventoryItems.filter(item => {
      if (!item.expirationDate) return false;
      const expDate = new Date(item.expirationDate);
      return expDate < today;
    }).length;

    return { totalItems, expiringSoon, expired };
  }, [inventoryItems]);

  // Filter items based on search, device, and filter type
  const filteredItems = useMemo(() => {
    let filtered = inventoryItems;

    // Filter by device if selected
    if (selectedDeviceId) {
      filtered = filtered.filter(item => item.deviceId === selectedDeviceId);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filterType === 'expiring') {
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(item => {
        if (!item.expirationDate) return false;
        const expDate = new Date(item.expirationDate);
        return expDate >= today && expDate <= threeDaysFromNow;
      });
    } else if (filterType === 'expired') {
      const today = new Date();
      filtered = filtered.filter(item => {
        if (!item.expirationDate) return false;
        const expDate = new Date(item.expirationDate);
        return expDate < today;
      });
    }

    return filtered;
  }, [inventoryItems, selectedDeviceId, searchQuery, filterType]);

  const displayedItems = displayLimit === -1 ? filteredItems : filteredItems.slice(0, displayLimit);

  const currentDevice = devices.find(d => d.id === selectedDeviceId);

  const handleCardClick = (type: 'total' | 'expiring' | 'expired' | 'add') => {
    switch (type) {
      case 'total':
        setFilterType('all');
        break;
      case 'expiring':
        setFilterType('expiring');
        break;
      case 'expired':
        setFilterType('expired');
        break;
      case 'add':
        setShowAddModal(true);
        break;
    }
  };

  if (devicesLoading || inventoryLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading CoolKeeper...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center">
                <Snowflake className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">CoolKeeper</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedDeviceId?.toString()} onValueChange={(value) => setSelectedDeviceId(parseInt(value))}>
                <SelectTrigger className="w-48">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Section */}
        <section className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h2>
            <p className="text-slate-600">Overview of your inventory status</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <DashboardCard
              title="Total Items"
              value={dashboardStats.totalItems}
              icon="box"
              color="blue"
              onClick={() => handleCardClick('total')}
            />
            <DashboardCard
              title="Expiring Soon"
              value={dashboardStats.expiringSoon}
              icon="clock"
              color="warning"
              subtitle="Next 3 days"
              onClick={() => handleCardClick('expiring')}
            />
            <DashboardCard
              title="Expired Items"
              value={dashboardStats.expired}
              icon="warning"
              color="expired"
              subtitle="Needs attention"
              onClick={() => handleCardClick('expired')}
            />
            <DashboardCard
              title="Add Items"
              value="+"
              icon="plus"
              color="gradient"
              subtitle="Add new inventory"
              onClick={() => handleCardClick('add')}
            />
          </div>
        </section>

        {/* Search Section */}
        <SearchSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          displayLimit={displayLimit}
          onDisplayLimitChange={setDisplayLimit}
        />

        {/* Inventory Table */}
        <InventoryTable
          items={displayedItems}
          totalItems={filteredItems.length}
          displayLimit={displayLimit}
          devices={devices}
        />
      </main>

      {/* Modals */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        devices={devices}
      />
      
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        devices={devices}
      />
    </div>
  );
}
