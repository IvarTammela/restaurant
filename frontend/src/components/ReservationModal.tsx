import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RestaurantTable, Filters } from '../types';
import { createReservation } from '../api';

interface Props {
  table: RestaurantTable;
  filters: Filters;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReservationModal({ table, filters, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('reservation.nameRequired'));
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
      setError(err instanceof Error ? err.message : t('reservation.failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        <h2>{t('reservation.title')}</h2>

        <div className="modal-details">
          <div className="detail-row">
            <span className="detail-label">{t('reservation.table')}</span>
            <span className="detail-value">#{table.tableNumber}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{t('reservation.seats')}</span>
            <span className="detail-value">{table.seats}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{t('reservation.zone')}</span>
            <span className="detail-value">{t(`zone.${table.zone}`)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{t('reservation.date')}</span>
            <span className="detail-value">{filters.date}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{t('reservation.time')}</span>
            <span className="detail-value">{filters.time} - {calculateEndTime(filters.time)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{t('reservation.party')}</span>
            <span className="detail-value">{t('reservation.people', { count: filters.partySize })}</span>
          </div>
          <div className="table-features">
            {table.windowSeat && <span className="feature">{t('reservation.windowSeat')}</span>}
            {table.privateArea && <span className="feature">{t('reservation.private')}</span>}
            {table.nearPlayground && <span className="feature">{t('reservation.playground')}</span>}
            {table.accessible && <span className="feature">{t('reservation.accessible')}</span>}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="filter-group">
            <label>{t('reservation.yourName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('reservation.namePlaceholder')}
              autoFocus
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button className="search-btn" type="submit" disabled={loading}>
            {loading ? t('reservation.submitting') : t('reservation.submit')}
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
