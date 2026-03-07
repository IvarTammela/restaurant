import { useEffect, useState } from 'react';
import type { Filters, Reservation, RestaurantTable, TableRecommendation } from './types';
import { fetchAllTables, fetchRecommendations, fetchReservations } from './api';
import FilterPanel from './components/FilterPanel';
import FloorPlan from './components/FloorPlan';
import ReservationModal from './components/ReservationModal';
import './App.css';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function App() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [recommendations, setRecommendations] = useState<TableRecommendation[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
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
  });

  useEffect(() => {
    fetchAllTables().then(setTables);
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
    // Refresh data
    const [newReservations] = await Promise.all([
      fetchReservations(),
    ]);
    setReservations(newReservations);
    // Re-run search to update recommendations
    const recs = await fetchRecommendations(filters);
    setRecommendations(recs);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>La Maison</h1>
        <p className="subtitle">Restorani laudade broneerimine</p>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <FilterPanel filters={filters} onChange={setFilters} onSearch={handleSearch} />
        </aside>

        <section className="content">
          {successMsg && <div className="success-msg">{successMsg}</div>}
          <FloorPlan
            tables={tables}
            recommendations={recommendations}
            reservations={reservations}
            selectedTable={selectedTable}
            filterDate={filters.date}
            filterTime={filters.time}
            onSelectTable={handleSelectTable}
          />
        </section>
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
