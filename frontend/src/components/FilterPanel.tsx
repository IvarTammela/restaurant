import { useTranslation } from 'react-i18next';
import type { Filters } from '../types';
import type { RoomDTO } from '../api';

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onSearch: () => void;
  maxPartySize: number;
  rooms: RoomDTO[];
}

export default function FilterPanel({ filters, onChange, onSearch, maxPartySize, rooms }: Props) {
  const { t } = useTranslation();
  const update = (field: Partial<Filters>) => onChange({ ...filters, ...field });

  return (
    <div className="filter-panel">
      <h2>{t('filter.searchTitle')}</h2>

      <div className="filter-grid">
        <div className="filter-group">
          <label>{t('filter.date')}</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label>{t('filter.time')}</label>
          <input
            type="time"
            value={filters.time}
            onChange={(e) => update({ time: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label>{t('filter.partySize')}</label>
          <input
            type="number"
            min={1}
            value={filters.partySize}
            onChange={(e) => update({ partySize: Number(e.target.value) })}
          />
        </div>
        {maxPartySize > 0 && (
          <div className="max-party-info">
            {t('filter.maxParty', { max: maxPartySize })}
          </div>
        )}
        {filters.partySize > 10 && (
          <div className="large-group-info">
            {t('filter.largeGroup')}
          </div>
        )}

        <div className="filter-group">
          <label>{t('filter.zone')}</label>
          <select
            value={filters.zone}
            onChange={(e) => update({ zone: e.target.value })}
          >
            <option value="">{t('filter.allZones')}</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="preferences">
        <h3>{t('filter.preferences')}</h3>
        <div className="pref-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.windowSeat}
              onChange={(e) => update({ windowSeat: e.target.checked })}
            />
            <span className="checkmark"></span>
            {t('filter.windowSeat')}
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.privateArea}
              onChange={(e) => update({ privateArea: e.target.checked })}
            />
            <span className="checkmark"></span>
            {t('filter.privateArea')}
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.nearPlayground}
              onChange={(e) => update({ nearPlayground: e.target.checked })}
            />
            <span className="checkmark"></span>
            {t('filter.nearPlayground')}
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.accessible}
              onChange={(e) => update({ accessible: e.target.checked })}
            />
            <span className="checkmark"></span>
            {t('filter.accessible')}
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.nearStage}
              onChange={(e) => update({ nearStage: e.target.checked })}
            />
            <span className="checkmark"></span>
            {t('filter.nearStage')} &#127925;
          </label>
        </div>
      </div>

      <button className="search-btn" onClick={onSearch}>
        {t('filter.searchBtn')}
      </button>
    </div>
  );
}
