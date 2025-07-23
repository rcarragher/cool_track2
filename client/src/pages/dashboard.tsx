import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Snowflake, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardCard from "@/components/dashboard-card";
import InventoryTable from "@/components/inventory-table";
import AddItemModal from "@/components/add-item-modal";
import SettingsModal from "@/components/settings-modal";
import { HeaderMenu } from "@/components/header-menu";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Device, InventoryItem } from "@shared/schema";

interface PaginatedInventoryResponse {
  items: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function Dashboard() {
  const { t } = useTranslation(['dashboard', 'common']);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'expiring' | 'expired'>('all');
  const [showFullList, setShowFullList] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  
  // Pagination state
  const [dashboardPage, setDashboardPage] = useState(1);
  const [allLoadedItems, setAllLoadedItems] = useState<InventoryItem[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 30;

  const { data: devices = [], isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ['/api/devices'],
  });

  // Query for dashboard items (paginated)
  const { data: dashboardInventoryData, isLoading: inventoryLoading } = useQuery<PaginatedInventoryResponse>({
    queryKey: ['/api/inventory', { page: dashboardPage, limit: ITEMS_PER_PAGE, search: searchQuery, deviceId: selectedDevice }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', dashboardPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (selectedDevice) {
        params.append('deviceId', selectedDevice.toString());
      }
      
      const response = await fetch(`/api/inventory?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      return response.json();
    },
  });

  // Query for all items (used for stats calculation)
  const { data: allInventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory'],
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['/api/settings'],
  });



  // Calculate dashboard stats
  const dashboardStats = useMemo(() => {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    const totalItems = allInventoryItems.length;
    
    const expiringSoon = allInventoryItems.filter(item => {
      if (!item.expirationDate) return false;
      const expDate = new Date(item.expirationDate);
      return expDate >= today && expDate <= threeDaysFromNow;
    }).length;
    
    const expired = allInventoryItems.filter(item => {
      if (!item.expirationDate) return false;
      const expDate = new Date(item.expirationDate);
      return expDate < today;
    }).length;

    return { totalItems, expiringSoon, expired };
  }, [allInventoryItems]);

  // Query for full list view (paginated)
  const { data: fullListData, isLoading: fullListLoading } = useQuery<PaginatedInventoryResponse>({
    queryKey: ['/api/inventory', { 
      page: currentPage, 
      limit: itemsPerPage, 
      search: searchQuery,
      deviceId: selectedDevice,
      filterType 
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (selectedDevice) {
        params.append('deviceId', selectedDevice.toString());
      }
      
      const response = await fetch(`/api/inventory?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      return response.json();
    },
    enabled: showFullList,
  });

  // Filter items for full list view (server-side filtering handles most cases)
  const getFilteredFullListItems = useMemo(() => {
    if (!fullListData) return [];
    
    let filtered = fullListData.items;

    // Apply client-side filtering for expiration status (not handled server-side)
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
  }, [fullListData, filterType]);

  // Accumulate items for dashboard view
  const accumulatedItems = useMemo(() => {
    if (!dashboardInventoryData) return [];
    
    // Reset accumulated items when search or device filter changes
    const key = `${searchQuery}-${selectedDevice}`;
    if (allLoadedItems.length === 0 || dashboardPage === 1) {
      return dashboardInventoryData.items;
    }
    
    // Add new items from current page
    const existingIds = new Set(allLoadedItems.map(item => item.id));
    const newItems = dashboardInventoryData.items.filter(item => !existingIds.has(item.id));
    return [...allLoadedItems, ...newItems];
  }, [dashboardInventoryData, allLoadedItems, searchQuery, selectedDevice, dashboardPage]);

  // Update accumulated items when dashboard data changes
  useEffect(() => {
    if (dashboardInventoryData?.items) {
      setAllLoadedItems(accumulatedItems);
    }
  }, [accumulatedItems, dashboardInventoryData]);

  // Reset pagination when search or device filter changes
  useEffect(() => {
    setDashboardPage(1);
    setAllLoadedItems([]);
  }, [searchQuery, selectedDevice]);

  // Load more handler
  const handleLoadMore = () => {
    if (dashboardInventoryData?.pagination.hasNext) {
      setDashboardPage(prev => prev + 1);
    }
  };

  // Get the appropriate items and pagination for current view
  const displayedItems = showFullList ? getFilteredFullListItems : (displayLimit === -1 ? accumulatedItems : accumulatedItems.slice(0, displayLimit));
  const totalPages = showFullList ? (fullListData?.pagination.totalPages || 1) : 1;
  const totalItems = showFullList ? (fullListData?.pagination.total || 0) : (dashboardInventoryData?.pagination.total || 0);
  const hasMore = showFullList ? false : (dashboardInventoryData?.pagination.hasNext || false);
  const paginatedItems = displayedItems;

  const handleCardClick = (type: 'total' | 'expiring' | 'expired' | 'add') => {
    switch (type) {
      case 'total':
        setFilterType('all');
        setShowFullList(true);
        setCurrentPage(1);
        break;
      case 'expiring':
        setFilterType('expiring');
        setShowFullList(true);
        setCurrentPage(1);
        break;
      case 'expired':
        setFilterType('expired');
        setShowFullList(true);
        setCurrentPage(1);
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
          <p className="text-slate-600">{t('dashboard:loading')}</p>
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
              {showFullList && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullList(false)}
                  className="flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 me-2" />
                  {t('dashboard:backToDashboard')}
                </Button>
              )}
              <HeaderMenu 
                onSettingsClick={() => setShowSettingsModal(true)}
                onChangePasswordClick={() => setShowChangePasswordModal(true)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showFullList ? (
          <>
            {/* Full List View */}
            <section className="mb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {filterType === 'all' ? t('dashboard:sections.allItems.title') : 
                   filterType === 'expiring' ? t('dashboard:sections.expiringSoon.title') : t('dashboard:sections.expired.title')}
                </h2>
                <p className="text-slate-600">
                  {filterType === 'all' ? t('dashboard:sections.allItems.description') : 
                   filterType === 'expiring' ? t('dashboard:sections.expiringSoon.description') : 
                   t('dashboard:sections.expired.description')}
                </p>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-600">
                    {t('dashboard:pagination.showing', { 
                      start: ((currentPage - 1) * itemsPerPage) + 1, 
                      end: Math.min(currentPage * itemsPerPage, totalItems), 
                      total: totalItems 
                    })}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600">{t('dashboard:pagination.itemsPerPage')}</span>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-slate-300 rounded px-2 py-1 text-sm"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    {t('common:buttons.previous')}
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    {t('dashboard:pagination.pageOf', { current: currentPage, total: totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    {t('common:buttons.next')}
                  </Button>
                </div>
              </div>

              {/* Inventory Table */}
              <InventoryTable
                items={paginatedItems}
                totalItems={totalItems}
                displayLimit={-1}
                devices={devices}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedDevice={selectedDevice}
                onDeviceFilterChange={setSelectedDevice}
              />
            </section>
          </>
        ) : (
          <>
            {/* Dashboard Section */}
            <section className="mb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('dashboard:title')}</h2>
                <p className="text-slate-600">{t('dashboard:subtitle')}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <DashboardCard
                  title={t('dashboard:cards.totalItems')}
                  value={dashboardStats.totalItems}
                  icon="box"
                  color="blue"
                  onClick={() => handleCardClick('total')}
                />
                <DashboardCard
                  title={t('dashboard:cards.expiringSoon')}
                  value={dashboardStats.expiringSoon}
                  icon="clock"
                  color="warning"
                  subtitle={t('dashboard:cards.subtitles.next3Days')}
                  onClick={() => handleCardClick('expiring')}
                />
                <DashboardCard
                  title={t('dashboard:cards.expiredItems')}
                  value={dashboardStats.expired}
                  icon="warning"
                  color="expired"
                  subtitle={t('dashboard:cards.subtitles.needsAttention')}
                  onClick={() => handleCardClick('expired')}
                />
                <DashboardCard
                  title={t('dashboard:cards.addItems')}
                  value="+"
                  icon="plus"
                  color="gradient"
                  subtitle={t('dashboard:cards.subtitles.addNewInventory')}
                  onClick={() => handleCardClick('add')}
                />
              </div>
            </section>

            {/* Inventory Table */}
            <InventoryTable
              items={displayedItems}
              totalItems={totalItems}
              displayLimit={displayLimit}
              devices={devices}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedDevice={selectedDevice}
              onDeviceFilterChange={setSelectedDevice}
              hasMore={hasMore}
              isLoading={inventoryLoading}
              onLoadMore={handleLoadMore}
            />
          </>
        )}
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

      {/* Change Password Modal */}
      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('auth.changePassword.title')}</DialogTitle>
          </DialogHeader>
          <ChangePasswordForm
            onSuccess={() => setShowChangePasswordModal(false)}
            onCancel={() => setShowChangePasswordModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
