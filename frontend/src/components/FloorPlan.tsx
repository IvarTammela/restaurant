import type { RestaurantTable, TableRecommendation, Reservation } from '../types';

interface Props {
  tables: RestaurantTable[];
  recommendations: TableRecommendation[];
  reservations: Reservation[];
  selectedTable: RestaurantTable | null;
  filterDate: string;
  filterTime: string;
  onSelectTable: (table: RestaurantTable) => void;
}

export default function FloorPlan({
  tables,
  recommendations,
  reservations,
  selectedTable,
  filterDate,
  filterTime,
  onSelectTable,
}: Props) {
  const recommendedIds = new Set(recommendations.map((r) => r.table.id));
  const scoreMap = new Map(recommendations.map((r) => [r.table.id, r.score]));

  // Determine which tables are occupied at the selected date/time
  const occupiedIds = new Set(
    reservations
      .filter((r) => {
        if (!filterDate || !filterTime) return false;
        if (r.date !== filterDate) return false;
        const start = r.startTime;
        const end = r.endTime;
        const check = filterTime + ':00';
        return check >= start && check < end;
      })
      .map((r) => r.table.id)
  );

  const hasSearched = recommendations.length > 0 || filterDate !== '';

  function getTableStatus(table: RestaurantTable) {
    if (selectedTable?.id === table.id) return 'selected';
    if (recommendedIds.has(table.id)) return 'recommended';
    if (occupiedIds.has(table.id)) return 'occupied';
    return 'available';
  }

  function getZoneLabel(zone: string) {
    switch (zone) {
      case 'MAIN_HALL': return 'Sisesaal';
      case 'TERRACE': return 'Terrass';
      case 'PRIVATE_ROOM': return 'Privaatruum';
      default: return zone;
    }
  }

  // Zone boundaries for visual regions
  const zoneRegions = [
    { zone: 'MAIN_HALL', label: 'Sisesaal', x: 0, y: 0, w: 55, h: 70 },
    { zone: 'TERRACE', label: 'Terrass', x: 57, y: 0, w: 43, h: 60 },
    { zone: 'PRIVATE_ROOM', label: 'Privaatruumid', x: 0, y: 72, w: 50, h: 28 },
  ];

  const bestScore = recommendations.length > 0 ? recommendations[0].score : 0;

  return (
    <div className="floor-plan-container">
      <h2>Saali plaan</h2>

      <div className="legend">
        <span className="legend-item"><span className="dot available"></span> Vaba</span>
        <span className="legend-item"><span className="dot occupied"></span> Hoivatud</span>
        <span className="legend-item"><span className="dot recommended"></span> Soovitatud</span>
        <span className="legend-item"><span className="dot selected"></span> Valitud</span>
      </div>

      <div className="floor-plan">
        {zoneRegions.map((region) => (
          <div
            key={region.zone}
            className={`zone-region zone-${region.zone.toLowerCase()}`}
            style={{
              left: `${region.x}%`,
              top: `${region.y}%`,
              width: `${region.w}%`,
              height: `${region.h}%`,
            }}
          >
            <span className="zone-label">{region.label}</span>
          </div>
        ))}

        {tables.map((table) => {
          const status = getTableStatus(table);
          const score = scoreMap.get(table.id);
          const isBest = score !== undefined && score === bestScore && hasSearched;
          const isClickable = status !== 'occupied';

          return (
            <div
              key={table.id}
              className={`table-marker ${status} ${isBest ? 'best' : ''} seats-${table.seats <= 2 ? 'small' : table.seats <= 4 ? 'medium' : table.seats <= 6 ? 'large' : 'xlarge'}`}
              style={{ left: `${table.posX}%`, top: `${table.posY}%` }}
              onClick={() => isClickable && onSelectTable(table)}
              title={`Laud ${table.tableNumber} | ${table.seats} kohta | ${getZoneLabel(table.zone)}${score !== undefined ? ` | Skoor: ${score}` : ''}`}
            >
              <span className="table-number">{table.tableNumber}</span>
              <span className="table-seats">{table.seats}</span>
              {score !== undefined && <span className="table-score">{score.toFixed(0)}p</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
