import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Filters, FloorElement, Reservation, RestaurantTable, TableRecommendation, Wall } from './types';
import { fetchAllTables, fetchElements, fetchRecommendations, fetchReservations, fetchRooms, fetchWalls } from './api';
import type { RoomDTO } from './api';
import FilterPanel from './components/FilterPanel';
import FloorPlanWrapper from './components/FloorPlanWrapper';
import AdminFloorPlanWrapper from './components/AdminFloorPlanWrapper';
import ReservationModal from './components/ReservationModal';
import './App.css';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function calcMaxPartySize(tables: RestaurantTable[]): number {
  const sorted = [...tables].sort((a, b) => b.seats - a.seats);
  return (sorted[0]?.seats ?? 0) + (sorted[1]?.seats ?? 0);
}

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'booking' | 'admin'>('booking');
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [recommendations, setRecommendations] = useState<TableRecommendation[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [floorElements, setFloorElements] = useState<FloorElement[]>([]);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [filters, setFilters] = useState<Filters>({
    date: todayStr(),
    time: '18:00',
    partySize: 2,
    zone: '',
    windowSeat: false,
    privateArea: false,
    nearPlayground: false,
    accessible: false,
    nearStage: false,
  });

  const refreshTables = () => fetchAllTables().then(setTables);
  const refreshElements = () => fetchElements().then(setFloorElements);
  const refreshWalls = () => fetchWalls().then(setWalls);
  const refreshRooms = () => fetchRooms().then(setRooms);

  useEffect(() => {
    refreshTables();
    refreshElements();
    refreshWalls();
    refreshRooms();
    fetchReservations().then(setReservations);
  }, []);

  async function handleSearch() {
    setSelectedTable(null);
    setSuccessMsg('');
    const recs = await fetchRecommendations(filters);
    setRecommendations(recs);
  }

  function handleSelectTable(table: RestaurantTable) {
    setSelectedTable(table);
    setShowModal(true);
    setSuccessMsg('');
  }

  async function handleReservationSuccess() {
    setShowModal(false);
    setSelectedTable(null);
    setSuccessMsg(t('reservation.success', { number: selectedTable?.tableNumber }));
    const [newReservations] = await Promise.all([
      fetchReservations(),
    ]);
    setReservations(newReservations);
    const recs = await fetchRecommendations(filters);
    setRecommendations(recs);
  }

  function toggleLanguage() {
    i18n.changeLanguage(i18n.language === 'et' ? 'en' : 'et');
  }

  // Refresh rooms when switching back from admin tab
  function handleTabChange(tab: 'booking' | 'admin') {
    setActiveTab(tab);
    if (tab === 'booking') {
      refreshRooms();
      refreshTables();
      refreshElements();
      refreshWalls();
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <h1>{t('app.title')}</h1>
          <p className="subtitle">{t('app.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {activeTab === 'admin' && <div className="admin-badge">{t('app.adminMode')}</div>}
          <nav className="app-nav">
            <button
              className={`nav-tab ${activeTab === 'booking' ? 'active' : ''}`}
              onClick={() => handleTabChange('booking')}
            >
              {t('app.booking')}
            </button>
            <button
              className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleTabChange('admin')}
            >
              &#9881; {t('app.admin')}
            </button>
            <button className="nav-tab lang-btn" onClick={toggleLanguage}>
              {i18n.language === 'et' ? 'EN' : 'ET'}
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'booking' ? (
          <>
            <aside className="sidebar">
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                onSearch={handleSearch}
                maxPartySize={calcMaxPartySize(tables)}
                rooms={rooms}
              />
            </aside>
            <section className="content">
              {successMsg && <div className="success-msg">{successMsg}</div>}
              <FloorPlanWrapper
                tables={tables}
                recommendations={recommendations}
                reservations={reservations}
                floorElements={floorElements}
                walls={walls}
                rooms={rooms}
                selectedTable={selectedTable}
                filterDate={filters.date}
                filterTime={filters.time}
                onSelectTable={handleSelectTable}
              />
            </section>
          </>
        ) : (
          <section className="content">
            <AdminFloorPlanWrapper tables={tables} floorElements={floorElements} walls={walls} onTablesChange={refreshTables} onElementsChange={refreshElements} onWallsChange={refreshWalls} />
          </section>
        )}
      </main>

      {showModal && selectedTable && (
        <ReservationModal
          table={selectedTable}
          filters={filters}
          onClose={() => { setShowModal(false); setSelectedTable(null); }}
          onSuccess={handleReservationSuccess}
        />
      )}
    </div>
  );
}

export default App;
