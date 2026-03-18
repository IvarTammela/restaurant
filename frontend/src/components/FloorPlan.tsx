import type { CSSProperties } from 'react';
import type { RestaurantTable, TableRecommendation, Reservation, FloorElement } from '../types';

interface Props {
  tables: RestaurantTable[];
  recommendations: TableRecommendation[];
  reservations: Reservation[];
  floorElements: FloorElement[];
  selectedTable: RestaurantTable | null;
  filterDate: string;
  filterTime: string;
  onSelectTable: (table: RestaurantTable) => void;
}


export default function FloorPlan({
  tables,
  recommendations,
  reservations,
  floorElements,
  selectedTable,
  filterDate,
  filterTime,
  onSelectTable,
}: Props) {
  const scoreMap = new Map(recommendations.map((r) => [r.table.id, r.score]));

  // combinedMap: tableId -> the other table it's merged with
  const combinedMap = new Map<number, RestaurantTable>();
  const combinedPairs: Array<{ t1: RestaurantTable; t2: RestaurantTable; totalSeats: number }> = [];
  const singleRecommendedIds = new Set<number>();

  recommendations.forEach((r) => {
    if (r.combinedWith) {
      combinedMap.set(r.table.id, r.combinedWith);
      combinedMap.set(r.combinedWith.id, r.table);
      combinedPairs.push({
        t1: r.table,
        t2: r.combinedWith,
        totalSeats: r.table.seats + r.combinedWith.seats,
      });
    } else {
      singleRecommendedIds.add(r.table.id);
    }
  });

  const occupiedIds = new Set(
    reservations
      .filter((r) => {
        if (!filterDate || !filterTime) return false;
        if (r.date !== filterDate) return false;
        const check = filterTime + ':00';
        return check >= r.startTime && check < r.endTime;
      })
      .map((r) => r.table.id)
  );

  const hasSearched = recommendations.length > 0 || filterDate !== '';
  const bestScore = recommendations.length > 0 ? recommendations[0].score : 0;

  function getTableStatus(table: RestaurantTable) {
    if (selectedTable?.id === table.id) return 'selected';
    if (combinedMap.has(table.id) || singleRecommendedIds.has(table.id)) return 'recommended';
    if (occupiedIds.has(table.id)) return 'occupied';
    return 'available';
  }

  function getTableStyle(table: RestaurantTable): CSSProperties {
    return { left: `${table.posX}%`, top: `${table.posY}%` };
  }

  function getTableTitle(table: RestaurantTable): string {
    const pair = combinedPairs.find((p) => p.t1.id === table.id || p.t2.id === table.id);
    if (pair) {
      const other = pair.t1.id === table.id ? pair.t2 : pair.t1;
      return `Lauad #${table.tableNumber} + #${other.tableNumber} \u2014 ${pair.totalSeats} kohta kokku`;
    }
    const score = scoreMap.get(table.id);
    const base = `Laud ${table.tableNumber} | ${table.seats} kohta | ${getZoneLabel(table.zone)}`;
    return score !== undefined ? `${base} | Skoor: ${score.toFixed(0)}` : base;
  }

  function getZoneLabel(zone: string) {
    switch (zone) {
      case 'MAIN_HALL': return 'Sisesaal';
      case 'TERRACE': return 'Terrass';
      case 'PRIVATE_ROOM': return 'Privaatruum';
      default: return zone;
    }
  }

  const zoneRegions = [
    { zone: 'MAIN_HALL', label: 'Sisesaal', x: 0, y: 0, w: 52, h: 72 },
    { zone: 'TERRACE', label: 'Terrass', x: 54, y: 0, w: 46, h: 72 },
    { zone: 'PRIVATE_ROOM', label: 'Privaatruumid', x: 0, y: 74, w: 100, h: 26 },
  ];

  return (
    <div className="floor-plan-container">
      <h2>Saali plaan</h2>

      <div className="legend">
        <span className="legend-item"><span className="dot available"></span> Vaba</span>
        <span className="legend-item"><span className="dot occupied"></span> Hoivatud</span>
        <span className="legend-item"><span className="dot recommended"></span> Soovitatud</span>
        <span className="legend-item"><span className="dot selected"></span> Valitud</span>
        <span className="legend-separator">|</span>
        <span className="legend-item legend-hint">Laua number / istekohta</span>
      </div>

      <div className="floor-plan">
        {/* Zone regions */}
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

        {/* SVG bridge between combined tables (rendered behind table markers) */}
        {combinedPairs.length > 0 && (
          <svg className="floor-plan-bridge" aria-hidden="true">
            <defs>
              <filter id="bridge-glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {combinedPairs.map((pair, i) => (
              <line
                key={i}
                x1={`${pair.t1.posX}%`}
                y1={`${pair.t1.posY}%`}
                x2={`${pair.t2.posX}%`}
                y2={`${pair.t2.posY}%`}
                stroke="rgba(200, 125, 56, 0.6)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="4 4"
                filter="url(#bridge-glow)"
              />
            ))}
          </svg>
        )}

        {/* Static restaurant elements from backend */}
        {floorElements.map((elem) => (
          <div
            key={elem.id}
            className={`floor-element ${elem.type}`}
            style={{
              left: `${elem.posX}%`,
              top: `${elem.posY}%`,
              width: `${elem.width}%`,
              height: `${elem.height}%`,
              transform: elem.rotation ? `rotate(${elem.rotation}deg)` : undefined,
              position: 'absolute',
            }}
            title={elem.name}
          >
            {elem.type === 'window' ? <span className="element-icon">{elem.name}</span>
              : elem.type === 'door' ? <span className="element-icon">{elem.name}</span>
              : elem.type === 'facility' ? <span className="element-icon">{elem.name}</span>
              : elem.name}
          </div>
        ))}

        {/* Tables */}
        {tables.map((table) => {
          const status = getTableStatus(table);
          const score = scoreMap.get(table.id);
          const isCombined = combinedMap.has(table.id);
          const isBest = score !== undefined && score === bestScore && hasSearched && !isCombined;
          const isClickable = status !== 'occupied';
          const sizeClass = `seats-${table.seats <= 2 ? 'small' : table.seats <= 4 ? 'medium' : table.seats <= 6 ? 'large' : 'xlarge'}`;

          return (
            <div
              key={table.id}
              className={`table-marker ${status} ${isBest ? 'best' : ''} ${isCombined ? 'combined' : ''} ${sizeClass}`}
              style={getTableStyle(table)}
              onClick={() => isClickable && onSelectTable(table)}
              title={getTableTitle(table)}
            >
              <span className="table-number">{table.tableNumber}</span>
              <span className="table-seats" title={`${table.seats} istekohta`}>{table.seats}</span>
              {score !== undefined && !isCombined && (
                <span className="table-score">{score.toFixed(0)}p</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
