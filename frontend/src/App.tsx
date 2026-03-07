import { useEffect, useState } from 'react';
import type { Filters, FloorElement, Reservation, RestaurantTable, TableRecommendation } from './types';
import { fetchAllTables, fetchElements, fetchRecommendations, fetchReservations } from './api';
import FilterPanel from './components/FilterPanel';
import FloorPlan from './components/FloorPlan';
import AdminFloorPlan from './components/AdminFloorPlan';
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
  const [activeTab, setActiveTab] = useState<'booking' | 'admin'>('booking');
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [recommendations, setRecommendations] = useState<TableRecommendation[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [floorElements, setFloorElements] = useState<FloorElement[]>([]);
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

  useEffect(() => {
    refreshTables();
    refreshElements();
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
    setSuccessMsg(`Laud #${selectedTable?.tableNumber} edukalt broneeritud!`);
    const [newReservations] = await Promise.all([
      fetchReservations(),
    ]);
    setReservations(newReservations);
    const recs = await fetchRecommendations(filters);
    setRecommendations(recs);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>La Maison</h1>
        <p className="subtitle">Restorani laudade broneerimine</p>
        <nav className="app-nav">
          <button
            className={`nav-tab ${activeTab === 'booking' ? 'active' : ''}`}
            onClick={() => setActiveTab('booking')}
          >
            Broneerimine
          </button>
          <button
            className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            &#9881; Admin
          </button>
        </nav>
        {activeTab === 'admin' && <div className="admin-badge">ADMIN MODE</div>}
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
              />
            </aside>
            <section className="content">
              {successMsg && <div className="success-msg">{successMsg}</div>}
              <FloorPlan
                tables={tables}
                recommendations={recommendations}
                reservations={reservations}
                floorElements={floorElements}
                selectedTable={selectedTable}
                filterDate={filters.date}
                filterTime={filters.time}
                onSelectTable={handleSelectTable}
              />
            </section>
          </>
        ) : (
          <section className="content">
            <AdminFloorPlan tables={tables} floorElements={floorElements} onTablesChange={refreshTables} onElementsChange={refreshElements} />
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
