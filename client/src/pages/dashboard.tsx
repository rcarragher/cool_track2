import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Snowflake, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardCard from "@/components/dashboard-card";
import InventoryTable from "@/components/inventory-table";
import AddItemModal from "@/components/add-item-modal";
import SettingsModal from "@/components/settings-modal";
import { HeaderMenu } from "@/components/header-menu";
import type { Device, InventoryItem } from "@shared/schema";

export default function Dashboard() {
  const { t } = useTranslation(['dashboard', 'common']);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'expiring' | 'expired'>('all');
  const [showFullList, setShowFullList] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);

  const { data: devices = [], isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ['/api/devices'],
  });

  const { data: inventoryItems = [], isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory'],
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['/api/settings'],
  });



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

  // Filter items based on search, filter type, and device
  const filteredItems = useMemo(() => {
    let filtered = inventoryItems;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    // Filter by device
    if (selectedDevice !== null) {
      filtered = filtered.filter(item => item.deviceId === selectedDevice);
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
  }, [inventoryItems, searchQuery, filterType, selectedDevice]);

  const displayedItems = displayLimit === -1 ? filteredItems : filteredItems.slice(0, displayLimit);

  // Pagination for full list view
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = showFullList 
    ? filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : displayedItems;

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
              <HeaderMenu onSettingsClick={() => setShowSettingsModal(true)} />
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
                      end: Math.min(currentPage * itemsPerPage, filteredItems.length), 
                      total: filteredItems.length 
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
                totalItems={filteredItems.length}
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
              totalItems={filteredItems.length}
              displayLimit={displayLimit}
              devices={devices}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedDevice={selectedDevice}
              onDeviceFilterChange={setSelectedDevice}
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
    </div>
  );
}
