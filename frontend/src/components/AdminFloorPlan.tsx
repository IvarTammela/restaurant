import { useRef, useState, useEffect, useCallback } from 'react';
import type { RestaurantTable, FloorElement, Zone } from '../types';
import {
  updateTablePosition, createNewTable, updateTable, deleteTable as apiDeleteTable,
  fetchRooms, createElement as apiCreateElement, updateElement as apiUpdateElement,
  deleteElement as apiDeleteElement,
} from '../api';
import type { RoomDTO } from '../api';

interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

type Tool = 'idle' | 'add-room' | 'add-table' | 'add-element';

const ELEMENT_TYPES = [
  { value: 'bar', label: 'Baar', icon: 'BAAR' },
  { value: 'kitchen', label: 'K\u00f6\u00f6k', icon: 'K\u00d6KK' },
  { value: 'stage', label: 'Lava', icon: '\u{1F3B5} LAVA' },
  { value: 'door', label: 'Uks', icon: '\u2191' },
  { value: 'window', label: 'Aken', icon: '\u25AF' },
  { value: 'playground', label: 'M\u00e4ngunurk', icon: '\u{1F9F8}' },
];

const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;

interface Props {
  tables: RestaurantTable[];
  floorElements: FloorElement[];
  onTablesChange: () => void;
  onElementsChange: () => void;
}

export default function AdminFloorPlan({ tables, floorElements, onTablesChange, onElementsChange }: Props) {
  const floorRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool>('idle');
  const [addSeats, setAddSeats] = useState(4);
  const [addShape, setAddShape] = useState<'square' | 'circle'>('square');
  const [addZone, setAddZone] = useState<Zone>('MAIN_HALL');
  const [addElemType, setAddElemType] = useState('bar');

  const [rooms, setRooms] = useState<Room[]>([]);
  const [tableShapes, setTableShapes] = useState<Record<number, string>>(() => {
    try { return JSON.parse(localStorage.getItem('admin_table_shapes') || '{}'); } catch { return {}; }
  });

  // Load rooms from backend on mount
  useEffect(() => {
    fetchRooms().then((data: RoomDTO[]) => {
      setRooms(data.map(r => ({ id: r.id, name: r.name, x: r.x, y: r.y, w: r.w, h: r.h })));
    });
  }, []);

  // --- Table drag state using refs (no stale closures) ---
  const dragTableRef = useRef<{ id: number; startX: number; startY: number } | null>(null);
  const [dragTablePos, setDragTablePos] = useState<{ id: number; x: number; y: number } | null>(null);

  // --- Element drag state using refs ---
  const dragElemRef = useRef<{ id: number; startX: number; startY: number } | null>(null);
  const [dragElemPos, setDragElemPos] = useState<{ id: number; x: number; y: number } | null>(null);

  // --- Element resize state using refs ---
  const resizeElemRef = useRef<{
    id: number; startMouseX: number; startMouseY: number;
    origW: number; origH: number; origX: number; origY: number; handle: string;
  } | null>(null);
  const [resizeElemSize, setResizeElemSize] = useState<{
    id: number; w: number; h: number; x: number; y: number;
  } | null>(null);

  // --- Element rotation state using refs ---
  const rotateElemRef = useRef<{
    id: number; centerX: number; centerY: number; startAngle: number; origRotation: number;
  } | null>(null);
  const [rotateElemAngle, setRotateElemAngle] = useState<{ id: number; rotation: number } | null>(null);

  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);
  const [namingRoom, setNamingRoom] = useState<Room | null>(null);
  const [newRoomName, setNewRoomName] = useState('');

  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [editingElement, setEditingElement] = useState<FloorElement | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState('');

  const [saveMsg, setSaveMsg] = useState('');

  // Table edit fields
  const [editSeats, setEditSeats] = useState(0);
  const [editZone, setEditZone] = useState<Zone>('MAIN_HALL');
  const [editWindow, setEditWindow] = useState(false);
  const [editPrivate, setEditPrivate] = useState(false);
  const [editPlayground, setEditPlayground] = useState(false);
  const [editAccessible, setEditAccessible] = useState(false);
  const [editStage, setEditStage] = useState(false);

  // Element edit fields
  const [editElemName, setEditElemName] = useState('');
  const [editElemWidth, setEditElemWidth] = useState(0);
  const [editElemHeight, setEditElemHeight] = useState(0);
  const [editElemRotation, setEditElemRotation] = useState(0);

  useEffect(() => { localStorage.setItem('admin_table_shapes', JSON.stringify(tableShapes)); }, [tableShapes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTool('idle');
        setDrawStart(null);
        setDrawEnd(null);
        setNamingRoom(null);
        setEditingTable(null);
        setEditingElement(null);
        setEditingRoomId(null);
        dragTableRef.current = null;
        setDragTablePos(null);
        dragElemRef.current = null;
        setDragElemPos(null);
        resizeElemRef.current = null;
        setResizeElemSize(null);
        rotateElemRef.current = null;
        setRotateElemAngle(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function toPercent(cx: number, cy: number) {
    if (!floorRef.current) return { x: 0, y: 0 };
    const r = floorRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((cx - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((cy - r.top) / r.height) * 100)),
    };
  }

  function showSaved() {
    setSaveMsg('Salvestatud \u2713');
    setTimeout(() => setSaveMsg(''), 2000);
  }

  // --- Room resize logic ---
  function applyRoomResize(orig: Room, handle: string, dx: number, dy: number): Room {
    let { x, y, w, h } = orig;
    if (handle === 'nw' || handle === 'w' || handle === 'sw') { x += dx; w -= dx; }
    if (handle === 'ne' || handle === 'e' || handle === 'se') { w += dx; }
    if (handle === 'nw' || handle === 'n' || handle === 'ne') { y += dy; h -= dy; }
    if (handle === 'sw' || handle === 's' || handle === 'se') { h += dy; }
    if (w < 3) { if (handle.includes('w')) x = orig.x + orig.w - 3; w = 3; }
    if (h < 3) { if (handle.includes('n')) y = orig.y + orig.h - 3; h = 3; }
    return { ...orig, x: Math.max(0, x), y: Math.max(0, y), w, h };
  }

  // ========== DOCUMENT-LEVEL DRAG HANDLERS ==========

  const handleDocMouseMove = useCallback((e: MouseEvent) => {
    if (!floorRef.current) return;
    const rect = floorRef.current.getBoundingClientRect();
    const pctX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    // Table drag
    if (dragTableRef.current) {
      setDragTablePos({ id: dragTableRef.current.id, x: pctX, y: pctY });
    }

    // Element drag
    if (dragElemRef.current) {
      setDragElemPos({ id: dragElemRef.current.id, x: pctX, y: pctY });
    }

    // Element resize
    if (resizeElemRef.current) {
      const r = resizeElemRef.current;
      const dx = pctX - r.startMouseX;
      const dy = pctY - r.startMouseY;
      let { origW: w, origH: h, origX: x, origY: y } = r;
      const handle = r.handle;
      if (handle.includes('e')) w += dx;
      if (handle.includes('w')) { w -= dx; x += dx; }
      if (handle.includes('s')) h += dy;
      if (handle.includes('n')) { h -= dy; y += dy; }
      w = Math.max(2, w);
      h = Math.max(2, h);
      setResizeElemSize({ id: r.id, w, h, x: Math.max(0, x), y: Math.max(0, y) });
    }

    // Element rotation
    if (rotateElemRef.current) {
      const r = rotateElemRef.current;
      const angle = Math.atan2(e.clientY - r.centerY, e.clientX - r.centerX) * (180 / Math.PI);
      let rotation = r.origRotation + (angle - r.startAngle);
      rotation = ((rotation % 360) + 360) % 360;
      setRotateElemAngle({ id: r.id, rotation });
    }
  }, []);

  const handleDocMouseUp = useCallback(async (e: MouseEvent) => {
    if (!floorRef.current) return;
    const rect = floorRef.current.getBoundingClientRect();
    const pctX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    // Table drag end
    if (dragTableRef.current) {
      const drag = dragTableRef.current;
      const moved = Math.abs(pctX - drag.startX) > 1 || Math.abs(pctY - drag.startY) > 1;
      dragTableRef.current = null;
      setDragTablePos(null);
      if (moved) {
        await updateTablePosition(drag.id, pctX, pctY);
        onTablesChange();
        showSaved();
      } else {
        const t = tables.find(t => t.id === drag.id);
        if (t) openTableEdit(t);
      }
      return;
    }

    // Element drag end
    if (dragElemRef.current) {
      const drag = dragElemRef.current;
      const moved = Math.abs(pctX - drag.startX) > 1 || Math.abs(pctY - drag.startY) > 1;
      dragElemRef.current = null;
      setDragElemPos(null);
      if (moved) {
        await apiUpdateElement(drag.id, { posX: pctX, posY: pctY });
        onElementsChange();
        showSaved();
      } else {
        const el = floorElements.find(e => e.id === drag.id);
        if (el) openElemEdit(el);
      }
      return;
    }

    // Element resize end
    if (resizeElemRef.current && resizeElemSize) {
      const id = resizeElemRef.current.id;
      resizeElemRef.current = null;
      const { w, h, x, y } = resizeElemSize;
      setResizeElemSize(null);
      await apiUpdateElement(id, { width: w, height: h, posX: x, posY: y });
      onElementsChange();
      showSaved();
      return;
    }

    // Element rotation end
    if (rotateElemRef.current && rotateElemAngle) {
      const id = rotateElemRef.current.id;
      rotateElemRef.current = null;
      const rotation = Math.round(rotateElemAngle.rotation);
      setRotateElemAngle(null);
      await apiUpdateElement(id, { rotation });
      onElementsChange();
      showSaved();
      return;
    }
  }, [tables, floorElements, onTablesChange, onElementsChange, resizeElemSize, rotateElemAngle]);

  useEffect(() => {
    document.addEventListener('mousemove', handleDocMouseMove);
    document.addEventListener('mouseup', handleDocMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleDocMouseMove);
      document.removeEventListener('mouseup', handleDocMouseUp);
    };
  }, [handleDocMouseMove, handleDocMouseUp]);

  // ========== START DRAG FUNCTIONS ==========

  function startTableDrag(e: React.MouseEvent, table: RestaurantTable) {
    if (tool !== 'idle') return;
    e.preventDefault(); e.stopPropagation();
    dragTableRef.current = { id: table.id, startX: table.posX, startY: table.posY };
    setDragTablePos({ id: table.id, x: table.posX, y: table.posY });
  }

  function startElemDrag(e: React.MouseEvent, elem: FloorElement) {
    if (tool !== 'idle') return;
    e.preventDefault(); e.stopPropagation();
    dragElemRef.current = { id: elem.id, startX: elem.posX, startY: elem.posY };
    setDragElemPos({ id: elem.id, x: elem.posX, y: elem.posY });
  }

  function startElemResize(e: React.MouseEvent, elem: FloorElement, handle: string) {
    e.preventDefault(); e.stopPropagation();
    const pos = toPercent(e.clientX, e.clientY);
    resizeElemRef.current = {
      id: elem.id, startMouseX: pos.x, startMouseY: pos.y,
      origW: elem.width, origH: elem.height, origX: elem.posX, origY: elem.posY, handle,
    };
  }

  function startElemRotate(e: React.MouseEvent, elem: FloorElement) {
    e.preventDefault(); e.stopPropagation();
    if (!floorRef.current) return;
    const rect = floorRef.current.getBoundingClientRect();
    const centerX = rect.left + (elem.posX / 100) * rect.width + (elem.width / 100) * rect.width / 2;
    const centerY = rect.top + (elem.posY / 100) * rect.height + (elem.height / 100) * rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    rotateElemRef.current = { id: elem.id, centerX, centerY, startAngle, origRotation: elem.rotation };
  }

  // ========== POSITION GETTERS ==========

  function getTablePos(t: RestaurantTable) {
    if (dragTablePos && dragTablePos.id === t.id) return { x: dragTablePos.x, y: dragTablePos.y };
    return { x: t.posX, y: t.posY };
  }

  function getElemStyle(elem: FloorElement): React.CSSProperties {
    let x = elem.posX, y = elem.posY, w = elem.width, h = elem.height, rot = elem.rotation;

    if (dragElemPos && dragElemPos.id === elem.id) {
      x = dragElemPos.x; y = dragElemPos.y;
    }
    if (resizeElemSize && resizeElemSize.id === elem.id) {
      w = resizeElemSize.w; h = resizeElemSize.h;
      x = resizeElemSize.x; y = resizeElemSize.y;
    }
    if (rotateElemAngle && rotateElemAngle.id === elem.id) {
      rot = rotateElemAngle.rotation;
    }

    return {
      left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`,
      transform: rot ? `rotate(${rot}deg)` : undefined,
      transformOrigin: 'center center',
      transition: (dragElemRef.current?.id === elem.id || resizeElemRef.current?.id === elem.id || rotateElemRef.current?.id === elem.id) ? 'none' : undefined,
    };
  }

  // ========== ROOM DRAG (React events on floor plan) ==========

  interface RoomDrag {
    kind: 'room-move' | 'room-resize';
    id: string;
    mouseStartX: number;
    mouseStartY: number;
    origX: number;
    origY: number;
    handle?: string;
    origRoom?: Room;
  }
  const [roomDrag, setRoomDrag] = useState<RoomDrag | null>(null);
  const [roomMousePos, setRoomMousePos] = useState<{ x: number; y: number } | null>(null);

  function getRoomPos(room: Room) {
    if (!roomDrag || !roomMousePos) return room;
    const dx = roomMousePos.x - roomDrag.mouseStartX;
    const dy = roomMousePos.y - roomDrag.mouseStartY;
    if (roomDrag.kind === 'room-move' && roomDrag.id === room.id) {
      return { ...room, x: Math.max(0, roomDrag.origX + dx), y: Math.max(0, roomDrag.origY + dy) };
    }
    if (roomDrag.kind === 'room-resize' && roomDrag.id === room.id && roomDrag.origRoom) {
      return applyRoomResize(roomDrag.origRoom, roomDrag.handle!, dx, dy);
    }
    return room;
  }

  // ========== FLOOR PLAN MOUSE HANDLERS ==========

  function handleFloorDown(e: React.MouseEvent) {
    const pos = toPercent(e.clientX, e.clientY);
    if (tool === 'add-room') { e.preventDefault(); setDrawStart(pos); setDrawEnd(null); return; }
    if (tool === 'add-table') { e.preventDefault(); addTable(pos.x, pos.y); return; }
    if (tool === 'add-element') { e.preventDefault(); handleAddElement(pos.x, pos.y); return; }
  }

  function handleMove(e: React.MouseEvent) {
    const pos = toPercent(e.clientX, e.clientY);
    if (tool === 'add-room' && drawStart) { setDrawEnd(pos); return; }
    if (roomDrag) setRoomMousePos(pos);
  }

  function handleUp() {
    if (tool === 'add-room' && drawStart && drawEnd) {
      const x = Math.min(drawStart.x, drawEnd.x);
      const y = Math.min(drawStart.y, drawEnd.y);
      const w = Math.abs(drawEnd.x - drawStart.x);
      const h = Math.abs(drawEnd.y - drawStart.y);
      if (w > 2 && h > 2) { setNamingRoom({ id: Date.now().toString(), name: '', x, y, w, h }); setNewRoomName(''); }
      setDrawStart(null); setDrawEnd(null);
      return;
    }

    if (roomDrag && roomMousePos) {
      const dx = roomMousePos.x - roomDrag.mouseStartX;
      const dy = roomMousePos.y - roomDrag.mouseStartY;
      const moved = Math.abs(dx) > 1 || Math.abs(dy) > 1;
      if (roomDrag.kind === 'room-move' && moved) {
        setRooms(p => p.map(r => r.id === roomDrag.id ? { ...r, x: Math.max(0, roomDrag.origX + dx), y: Math.max(0, roomDrag.origY + dy) } : r));
      }
      if (roomDrag.kind === 'room-resize' && roomDrag.origRoom && moved) {
        const updated = applyRoomResize(roomDrag.origRoom, roomDrag.handle!, dx, dy);
        setRooms(p => p.map(r => r.id === roomDrag.id ? updated : r));
      }
    }
    setRoomDrag(null); setRoomMousePos(null);
  }

  function startRoomDrag(e: React.MouseEvent, kind: RoomDrag['kind'], id: string, ox: number, oy: number, extra?: Partial<RoomDrag>) {
    if (tool !== 'idle') return;
    e.preventDefault(); e.stopPropagation();
    const pos = toPercent(e.clientX, e.clientY);
    setRoomDrag({ kind, id, mouseStartX: pos.x, mouseStartY: pos.y, origX: ox, origY: oy, ...extra });
    setRoomMousePos(pos);
  }

  // ========== CRUD ==========

  async function addTable(px: number, py: number) {
    const maxN = tables.reduce((m, t) => Math.max(m, t.tableNumber), 0);
    await createNewTable({ tableNumber: maxN + 1, seats: addSeats, zone: addZone, posX: px, posY: py });
    setTool('idle');
    onTablesChange();
  }

  async function handleAddElement(px: number, py: number) {
    const info = ELEMENT_TYPES.find(t => t.value === addElemType);
    await apiCreateElement({
      type: addElemType, name: info?.icon ?? addElemType,
      posX: px, posY: py, width: 8, height: 5, rotation: 0,
    });
    setTool('idle');
    onElementsChange();
  }

  function saveNewRoom() {
    if (!namingRoom || !newRoomName.trim()) return;
    setRooms(p => [...p, { ...namingRoom, name: newRoomName.trim() }]);
    setNamingRoom(null); setNewRoomName(''); setTool('idle');
  }

  function deleteRoom(id: string) { setRooms(p => p.filter(r => r.id !== id)); }

  async function handleDeleteElement(e: React.MouseEvent, id: number) {
    e.stopPropagation(); e.preventDefault();
    await apiDeleteElement(id);
    if (editingElement?.id === id) setEditingElement(null);
    onElementsChange();
  }

  async function handleDeleteTable(e: React.MouseEvent, id: number) {
    e.stopPropagation(); e.preventDefault();
    setTableShapes(p => { const n = { ...p }; delete n[id]; return n; });
    await apiDeleteTable(id);
    if (editingTable?.id === id) setEditingTable(null);
    onTablesChange();
  }

  function openTableEdit(t: RestaurantTable) {
    setEditingElement(null);
    setEditingTable(t); setEditSeats(t.seats); setEditZone(t.zone as Zone);
    setEditWindow(t.windowSeat); setEditPrivate(t.privateArea);
    setEditPlayground(t.nearPlayground); setEditAccessible(t.accessible); setEditStage(t.nearStage);
  }

  function openElemEdit(elem: FloorElement) {
    setEditingTable(null);
    setEditingElement(elem);
    setEditElemName(elem.name);
    setEditElemWidth(elem.width);
    setEditElemHeight(elem.height);
    setEditElemRotation(elem.rotation);
  }

  async function saveTableEdit() {
    if (!editingTable) return;
    await updateTable(editingTable.id, {
      seats: editSeats, zone: editZone, windowSeat: editWindow,
      privateArea: editPrivate, nearPlayground: editPlayground,
      accessible: editAccessible, nearStage: editStage,
    });
    setEditingTable(null); onTablesChange(); showSaved();
  }

  async function saveElemEdit() {
    if (!editingElement) return;
    await apiUpdateElement(editingElement.id, {
      name: editElemName, width: editElemWidth,
      height: editElemHeight, rotation: editElemRotation,
    });
    setEditingElement(null); onElementsChange(); showSaved();
  }

  async function handleReset() {
    if (!window.confirm('Kustuta k\u00f5ik lauad, ruumid ja elemendid?')) return;
    setRooms([]); setTableShapes({});
    setEditingTable(null); setEditingElement(null); setEditingRoomId(null);
    for (const t of tables) await apiDeleteTable(t.id);
    for (const e of floorElements) await apiDeleteElement(e.id);
    onTablesChange(); onElementsChange();
  }

  // ========== DRAWING PREVIEW ==========

  const drawRect = drawStart && drawEnd ? {
    x: Math.min(drawStart.x, drawEnd.x), y: Math.min(drawStart.y, drawEnd.y),
    w: Math.abs(drawEnd.x - drawStart.x), h: Math.abs(drawEnd.y - drawStart.y),
  } : null;

  const cursor = tool === 'add-room' ? 'cursor-crosshair' : tool !== 'idle' ? 'cursor-cell' : '';

  return (
    <div className="admin-view">
      <div className="admin-toolbar">
        <button className={`admin-tool-btn ${tool === 'add-room' ? 'active' : ''}`}
          onClick={() => setTool(tool === 'add-room' ? 'idle' : 'add-room')}>+ Lisa ruum</button>

        <div className="admin-tool-group">
          <button className={`admin-tool-btn ${tool === 'add-table' ? 'active' : ''}`}
            onClick={() => setTool(tool === 'add-table' ? 'idle' : 'add-table')}>+ Lisa laud</button>
          {tool === 'add-table' && (
            <div className="admin-inline-form">
              <select value={addSeats} onChange={e => setAddSeats(+e.target.value)}>
                {[2, 4, 6, 8, 10].map(n => <option key={n} value={n}>{n} kohta</option>)}
              </select>
              <select value={addShape} onChange={e => setAddShape(e.target.value as 'square' | 'circle')}>
                <option value="square">&#9633; Ruut</option>
                <option value="circle">&#9675; Ring</option>
              </select>
              <select value={addZone} onChange={e => setAddZone(e.target.value as Zone)}>
                <option value="MAIN_HALL">Sisesaal</option>
                <option value="TERRACE">Terrass</option>
                <option value="PRIVATE_ROOM">Privaatruum</option>
              </select>
            </div>
          )}
        </div>

        <div className="admin-tool-group">
          <button className={`admin-tool-btn ${tool === 'add-element' ? 'active' : ''}`}
            onClick={() => setTool(tool === 'add-element' ? 'idle' : 'add-element')}>+ Lisa element</button>
          {tool === 'add-element' && (
            <div className="admin-inline-form">
              <select value={addElemType} onChange={e => setAddElemType(e.target.value)}>
                {ELEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          )}
        </div>

        <button className="admin-tool-btn admin-reset-btn" onClick={handleReset}>&#128465; L\u00e4htesta</button>

        {saveMsg && <span className="admin-save-msg">{saveMsg}</span>}

        {tool !== 'idle' && (
          <span className="admin-hint">
            {tool === 'add-room' && 'Lohista hiirt ruumi joonistamiseks \u00B7 ESC t\u00fchistab'}
            {tool === 'add-table' && 'Kliki saaliplaanile laua paigutamiseks \u00B7 ESC t\u00fchistab'}
            {tool === 'add-element' && 'Kliki saaliplaanile elemendi paigutamiseks \u00B7 ESC t\u00fchistab'}
          </span>
        )}
      </div>

      <div className="admin-floor-wrap">
        <div className={`floor-plan admin-canvas ${cursor}`} ref={floorRef}
          onMouseDown={handleFloorDown} onMouseMove={handleMove}
          onMouseUp={handleUp}>

          {/* Rooms */}
          {rooms.map(room => {
            const p = getRoomPos(room);
            const isDragging = (roomDrag?.kind === 'room-move' || roomDrag?.kind === 'room-resize') && roomDrag.id === room.id;
            return (
              <div key={room.id} className={`admin-room ${isDragging ? 'dragging' : ''}`}
                style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, height: `${p.h}%`, transition: isDragging ? 'none' : undefined }}
                onMouseDown={e => startRoomDrag(e, 'room-move', room.id, room.x, room.y)}>
                {editingRoomId === room.id ? (
                  <input className="admin-inline-input" autoFocus value={editingRoomName}
                    onChange={e => setEditingRoomName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { setRooms(p => p.map(r => r.id === editingRoomId ? { ...r, name: editingRoomName.trim() || r.name } : r)); setEditingRoomId(null); } if (e.key === 'Escape') setEditingRoomId(null); }}
                    onBlur={() => { setRooms(p => p.map(r => r.id === editingRoomId ? { ...r, name: editingRoomName.trim() || r.name } : r)); setEditingRoomId(null); }}
                    onMouseDown={e => e.stopPropagation()} />
                ) : (
                  <span className="admin-room-label"
                    onDoubleClick={e => { e.stopPropagation(); setEditingRoomId(room.id); setEditingRoomName(room.name); }}>
                    {room.name}
                  </span>
                )}
                <button className="admin-item-delete" onMouseDown={e => { e.stopPropagation(); deleteRoom(room.id); }}>&times;</button>
                {RESIZE_HANDLES.map(h => (
                  <div key={h} className={`resize-handle rh-${h}`}
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); const pos = toPercent(e.clientX, e.clientY); setRoomDrag({ kind: 'room-resize', id: room.id, mouseStartX: pos.x, mouseStartY: pos.y, origX: 0, origY: 0, handle: h, origRoom: { ...room } }); setRoomMousePos(pos); }} />
                ))}
              </div>
            );
          })}

          {/* Draw preview */}
          {drawRect && <div className="room-draw-preview" style={{ left: `${drawRect.x}%`, top: `${drawRect.y}%`, width: `${drawRect.w}%`, height: `${drawRect.h}%` }} />}

          {/* Floor elements */}
          {floorElements.map(elem => {
            const isActive = dragElemRef.current?.id === elem.id || resizeElemRef.current?.id === elem.id || rotateElemRef.current?.id === elem.id;
            const isSelected = editingElement?.id === elem.id;
            return (
              <div key={elem.id}
                className={`admin-elem admin-elem-${elem.type} ${isActive ? 'dragging' : ''} ${isSelected ? 'elem-selected' : ''}`}
                style={getElemStyle(elem)}
                onMouseDown={e => startElemDrag(e, elem)}>
                <span className="admin-elem-label">{elem.name}</span>
                <button className="admin-item-delete" onMouseDown={e => handleDeleteElement(e, elem.id)}>&times;</button>
                {/* Resize handle (SE corner) */}
                <div className="elem-resize-handle"
                  onMouseDown={e => startElemResize(e, elem, 'se')}
                  title="Muuda suurust" />
                {/* Rotation handle (top center) */}
                <div className="elem-rotate-handle"
                  onMouseDown={e => startElemRotate(e, elem)}
                  title="P\u00f6\u00f6ra">&#x21bb;</div>
              </div>
            );
          })}

          {/* Tables */}
          {tables.map(table => {
            const p = getTablePos(table);
            const isDragging = dragTablePos?.id === table.id;
            const sz = `seats-${table.seats <= 2 ? 'small' : table.seats <= 4 ? 'medium' : table.seats <= 6 ? 'large' : 'xlarge'}`;
            const shape = tableShapes[table.id] || 'square';
            const isEditing = editingTable?.id === table.id;
            return (
              <div key={table.id}
                className={`table-marker available admin-table ${sz} ${isDragging ? 'dragging' : ''} ${isEditing ? 'editing' : ''} ${shape === 'circle' ? 'shape-circle' : ''}`}
                style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: isDragging ? 0.7 : 1, transition: isDragging ? 'none' : undefined }}
                onMouseDown={e => startTableDrag(e, table)}
                title={`Laud ${table.tableNumber} | ${table.seats} kohta`}>
                <span className="table-number">{table.tableNumber}</span>
                <span className="table-seats">{table.seats}</span>
                <button className="admin-delete-btn" onMouseDown={e => handleDeleteTable(e, table.id)} title="Kustuta laud">&times;</button>
              </div>
            );
          })}
        </div>

        {/* Room naming */}
        {namingRoom && (
          <div className="room-name-popup">
            <label>Ruumi nimi:</label>
            <input autoFocus value={newRoomName} onChange={e => setNewRoomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveNewRoom()} placeholder="nt. VIP ruum" />
            <div className="room-name-actions">
              <button onClick={saveNewRoom} className="admin-tool-btn active">Salvesta</button>
              <button onClick={() => { setNamingRoom(null); setTool('idle'); }} className="admin-tool-btn">T\u00fchista</button>
            </div>
          </div>
        )}

        {/* Table edit panel */}
        {editingTable && (
          <div className="admin-edit-panel">
            <h3>Laud #{editingTable.tableNumber}</h3>
            <div className="admin-edit-form">
              <label>Kohti:<select value={editSeats} onChange={e => setEditSeats(+e.target.value)}>
                {[2, 4, 6, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}
              </select></label>
              <label>Tsoon:<select value={editZone} onChange={e => setEditZone(e.target.value as Zone)}>
                <option value="MAIN_HALL">Sisesaal</option>
                <option value="TERRACE">Terrass</option>
                <option value="PRIVATE_ROOM">Privaatruum</option>
              </select></label>
              <div className="admin-checkboxes">
                <label><input type="checkbox" checked={editWindow} onChange={e => setEditWindow(e.target.checked)} /> Akna \u00e4\u00e4res</label>
                <label><input type="checkbox" checked={editPrivate} onChange={e => setEditPrivate(e.target.checked)} /> Privaatne</label>
                <label><input type="checkbox" checked={editPlayground} onChange={e => setEditPlayground(e.target.checked)} /> M\u00e4ngunurk</label>
                <label><input type="checkbox" checked={editAccessible} onChange={e => setEditAccessible(e.target.checked)} /> Ligip\u00e4\u00e4setav</label>
                <label><input type="checkbox" checked={editStage} onChange={e => setEditStage(e.target.checked)} /> Lava l\u00e4hedal</label>
              </div>
              <div className="admin-edit-actions">
                <button onClick={saveTableEdit} className="admin-tool-btn active">Salvesta</button>
                <button onClick={() => setEditingTable(null)} className="admin-tool-btn">Sulge</button>
              </div>
            </div>
          </div>
        )}

        {/* Element edit panel */}
        {editingElement && (
          <div className="admin-edit-panel">
            <h3>Element: {editingElement.type}</h3>
            <div className="admin-edit-form">
              <label>Nimi:
                <input type="text" value={editElemName} onChange={e => setEditElemName(e.target.value)}
                  className="admin-edit-input" />
              </label>
              <label>Laius (%):
                <input type="number" value={editElemWidth} onChange={e => setEditElemWidth(+e.target.value)}
                  min={1} max={100} step={0.5} className="admin-edit-input" />
              </label>
              <label>K\u00f5rgus (%):
                <input type="number" value={editElemHeight} onChange={e => setEditElemHeight(+e.target.value)}
                  min={1} max={100} step={0.5} className="admin-edit-input" />
              </label>
              <label>P\u00f6\u00f6rdenurk:
                <div className="admin-rotation-control">
                  <input type="range" min={0} max={360} value={editElemRotation}
                    onChange={e => setEditElemRotation(+e.target.value)} />
                  <span className="admin-rotation-value">{editElemRotation}\u00b0</span>
                </div>
              </label>
              <div className="admin-edit-actions">
                <button onClick={saveElemEdit} className="admin-tool-btn active">Salvesta</button>
                <button onClick={() => setEditingElement(null)} className="admin-tool-btn">Sulge</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
