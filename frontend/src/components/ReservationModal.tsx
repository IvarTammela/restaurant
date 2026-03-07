import { useState } from 'react';
import type { RestaurantTable, Filters } from '../types';
import { createReservation } from '../api';

interface Props {
  table: RestaurantTable;
  filters: Filters;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReservationModal({ table, filters, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Palun sisesta nimi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createReservation({
        tableId: table.id,
        customerName: name.trim(),
        date: filters.date,
        startTime: filters.time,
        partySize: filters.partySize,
      });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Broneerimine ebaonnestus');
    } finally {
      setLoading(false);
    }
  }

  function getZoneLabel(zone: string) {
    switch (zone) {
      case 'MAIN_HALL': return 'Sisesaal';
      case 'TERRACE': return 'Terrass';
      case 'PRIVATE_ROOM': return 'Privaatruum';
      default: return zone;
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        <h2>Broneeri laud</h2>

        <div className="modal-details">
          <div className="detail-row">
            <span className="detail-label">Laud</span>
            <span className="detail-value">#{table.tableNumber}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Kohti</span>
            <span className="detail-value">{table.seats}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Tsoon</span>
            <span className="detail-value">{getZoneLabel(table.zone)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Kuupaev</span>
            <span className="detail-value">{filters.date}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Kellaaeg</span>
            <span className="detail-value">{filters.time} - {calculateEndTime(filters.time)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Seltskond</span>
            <span className="detail-value">{filters.partySize} inimest</span>
          </div>
          <div className="table-features">
            {table.windowSeat && <span className="feature">Aknakoht</span>}
            {table.privateArea && <span className="feature">Privaatne</span>}
            {table.nearPlayground && <span className="feature">Mangunurk</span>}
            {table.accessible && <span className="feature">Ligipaasetav</span>}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="filter-group">
            <label>Sinu nimi</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sisesta nimi"
              autoFocus
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button className="search-btn" type="submit" disabled={loading}>
            {loading ? 'Broneerin...' : 'Kinnita broneering'}
          </button>
        </form>
      </div>
    </div>
  );
}

function calculateEndTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const endH = h + 2;
  return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
