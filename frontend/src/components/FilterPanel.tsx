import type { Filters, Zone } from '../types';

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onSearch: () => void;
}

const zones: { value: Zone | ''; label: string }[] = [
  { value: '', label: 'Koik tsoonid' },
  { value: 'MAIN_HALL', label: 'Sisesaal' },
  { value: 'TERRACE', label: 'Terrass' },
  { value: 'PRIVATE_ROOM', label: 'Privaatruum' },
];

export default function FilterPanel({ filters, onChange, onSearch }: Props) {
  const update = (field: Partial<Filters>) => onChange({ ...filters, ...field });

  return (
    <div className="filter-panel">
      <h2>Otsi lauda</h2>

      <div className="filter-grid">
        <div className="filter-group">
          <label>Kuupaev</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label>Kellaaeg</label>
          <input
            type="time"
            value={filters.time}
            onChange={(e) => update({ time: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label>Seltskonna suurus</label>
          <input
            type="number"
            min={1}
            max={20}
            value={filters.partySize}
            onChange={(e) => update({ partySize: Number(e.target.value) })}
          />
        </div>

        <div className="filter-group">
          <label>Tsoon</label>
          <select
            value={filters.zone}
            onChange={(e) => update({ zone: e.target.value as Zone | '' })}
          >
            {zones.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="preferences">
        <h3>Eelistused</h3>
        <div className="pref-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.windowSeat}
              onChange={(e) => update({ windowSeat: e.target.checked })}
            />
            <span className="checkmark"></span>
            Akna all
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.privateArea}
              onChange={(e) => update({ privateArea: e.target.checked })}
            />
            <span className="checkmark"></span>
            Privaatne nurk
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.nearPlayground}
              onChange={(e) => update({ nearPlayground: e.target.checked })}
            />
            <span className="checkmark"></span>
            Mangunurga lahedal
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.accessible}
              onChange={(e) => update({ accessible: e.target.checked })}
            />
            <span className="checkmark"></span>
            Ligipaasetav
          </label>
        </div>
      </div>

      <button className="search-btn" onClick={onSearch}>
        Otsi vabu laudu
      </button>
    </div>
  );
}
