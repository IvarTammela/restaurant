import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { RestaurantTable, FloorElement, Wall } from '../types';
import {
  updateTablePosition, createNewTable, updateTable, deleteTable as apiDeleteTable,
  fetchRooms, createElement as apiCreateElement, updateElement as apiUpdateElement,
  deleteElement as apiDeleteElement, createRoom as apiCreateRoom, deleteRoom as apiDeleteRoom,
  deleteAllTables, deleteAllElements, deleteAllRooms,
  createWall as apiCreateWall, deleteWall as apiDeleteWall, deleteAllWalls,
} from '../api';
import type { RoomDTO } from '../api';

interface Room {
  id: number;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

type Tool = 'idle' | 'add-room' | 'add-table' | 'add-element' | 'add-wall';

const ELEMENT_TYPE_KEYS = ['bar', 'kitchen', 'stage', 'door', 'window', 'playground'] as const;
const ELEMENT_ICONS: Record<string, string> = {
  bar: 'BAAR',
  kitchen: 'KÖKK',
  stage: '\u{1F3B5} LAVA',
  door: '\u2191',
  window: '\u25AF',
  playground: '\u{1F9F8}',
};

const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;

interface Props {
  tables: RestaurantTable[];
  floorElements: FloorElement[];
  walls: Wall[];
  onTablesChange: () => void;
  onElementsChange: () => void;
  onWallsChange: () => void;
}

export default function AdminFloorPlan({ tables, floorElements, walls, onTablesChange, onElementsChange, onWallsChange }: Props) {
  const { t } = useTranslation();
  const floorRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool>('idle');
  const [addSeats, setAddSeats] = useState(4);
  const [addShape, setAddShape] = useState<'square' | 'circle'>('square');
  const [addZone, setAddZone] = useState('');
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

  // Set default addZone when rooms load
  useEffect(() => {
    if (rooms.length > 0 && !addZone) {
      setAddZone(rooms[0].name);
    }
  }, [rooms, addZone]);

  // --- Table drag state using refs (no stale closures) ---
  const dragTableRef = useRef<{ id: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const [dragTablePos, setDragTablePos] = useState<{ id: number; x: number; y: number } | null>(null);

  // --- Element drag state using refs ---
  const dragElemRef = useRef<{ id: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
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
  const [namingRoom, setNamingRoom] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [newRoomName, setNewRoomName] = useState('');

  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [editingElement, setEditingElement] = useState<FloorElement | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editingRoomName, setEditingRoomName] = useState('');

  const [saveMsg, setSaveMsg] = useState('');


  // Table edit fields
  const [editSeats, setEditSeats] = useState(0);
  const [editZone, setEditZone] = useState('');
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

  // Wall state
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);
  const [wallPreviewEnd, setWallPreviewEnd] = useState<{ x: number; y: number } | null>(null);
  const [wallColor, setWallColor] = useState('#888888');
  const [wallThickness, setWallThickness] = useState(4);
  const [selectedWallId, setSelectedWallId] = useState<number | null>(null);

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
        roomDragRef.current = null;
        setWallStart(null);
        setWallPreviewEnd(null);
        setSelectedWallId(null);
      }
      if (e.key === 'Delete' && selectedWallId !== null) {
        apiDeleteWall(selectedWallId).then(() => { setSelectedWallId(null); onWallsChange(); });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedWallId, onWallsChange]);

  function toPercent(cx: number, cy: number) {
    if (!floorRef.current) return { x: 0, y: 0 };
    const r = floorRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((cx - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((cy - r.top) / r.height) * 100)),
    };
  }

  function showSaved() {
    setSaveMsg(t('admin.saved'));
    setTimeout(() => setSaveMsg(''), 2000);
  }

  // --- Room resize logic ---
  function applyRoomResize(orig: Room, handle: string, dx: number, dy: number): Room {
    let { x, y, w, h } = orig;
    if (handle === 'nw' || handle === 'w' || handle === 'sw') { x += dx; w -= dx; }
    if (handle === 'ne' || handle === 'e' || handle === 'se') { w += dx; }
    if (handle === 'nw' || handle === 'n' || handle === 'ne') { y += dy; h -= dy; }
    if (handle === 'sw' || handle === 's' || handle === 'se') { h += dy; }
    if (w < 0.5) { if (handle.includes('w')) x = orig.x + orig.w - 0.5; w = 0.5; }
    if (h < 0.5) { if (handle.includes('n')) y = orig.y + orig.h - 0.5; h = 0.5; }
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
      const { id, offsetX, offsetY } = dragTableRef.current;
      setDragTablePos({ id, x: pctX - offsetX, y: pctY - offsetY });
    }

    // Element drag
    if (dragElemRef.current) {
      const { id, offsetX, offsetY } = dragElemRef.current;
      setDragElemPos({ id, x: pctX - offsetX, y: pctY - offsetY });
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
      w = Math.max(0.5, w);
      h = Math.max(0.5, h);
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

    // Room drag/resize (document-level so it works outside floor-plan bounds)
    if (roomDragRef.current) {
      setRoomMousePos({ x: pctX, y: pctY });
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

    // Room drag/resize end (document-level)
    if (roomDragRef.current) {
      const drag = roomDragRef.current;
      const dx = pctX - drag.mouseStartX;
      const dy = pctY - drag.mouseStartY;
      const moved = Math.abs(dx) > 1 || Math.abs(dy) > 1;
      if (drag.kind === 'room-move' && moved) {
        setRooms(p => p.map(r => r.id === drag.id ? { ...r, x: Math.max(0, drag.origX + dx), y: Math.max(0, drag.origY + dy) } : r));
      }
      if (drag.kind === 'room-resize' && drag.origRoom && moved) {
        const updated = applyRoomResize(drag.origRoom, drag.handle!, dx, dy);
        setRooms(p => p.map(r => r.id === drag.id ? updated : r));
      }
      setRoomDrag(null); roomDragRef.current = null; setRoomMousePos(null);
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
    const pos = toPercent(e.clientX, e.clientY);
    const offsetX = pos.x - table.posX;
    const offsetY = pos.y - table.posY;
    dragTableRef.current = { id: table.id, startX: table.posX, startY: table.posY, offsetX, offsetY };
    setDragTablePos({ id: table.id, x: table.posX, y: table.posY });
  }

  function startElemDrag(e: React.MouseEvent, elem: FloorElement) {
    if (tool !== 'idle') return;
    e.preventDefault(); e.stopPropagation();
    const pos = toPercent(e.clientX, e.clientY);
    const offsetX = pos.x - elem.posX;
    const offsetY = pos.y - elem.posY;
    dragElemRef.current = { id: elem.id, startX: elem.posX, startY: elem.posY, offsetX, offsetY };
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
    id: number;
    mouseStartX: number;
    mouseStartY: number;
    origX: number;
    origY: number;
    handle?: string;
    origRoom?: Room;
  }
  const [roomDrag, setRoomDrag] = useState<RoomDrag | null>(null);
  const [roomMousePos, setRoomMousePos] = useState<{ x: number; y: number } | null>(null);
  const roomDragRef = useRef<RoomDrag | null>(null);

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
    if (tool === 'add-wall') {
      e.preventDefault();
      if (!wallStart) {
        setWallStart(pos);
        setWallPreviewEnd(pos);
      } else {
        // Second click: create the wall
        apiCreateWall({ x1: wallStart.x, y1: wallStart.y, x2: pos.x, y2: pos.y, color: wallColor, thickness: wallThickness })
          .then(() => { onWallsChange(); });
        setWallStart(null);
        setWallPreviewEnd(null);
      }
      return;
    }
    // Deselect wall when clicking on empty space in idle mode
    if (tool === 'idle') { setSelectedWallId(null); }
  }

  function handleMove(e: React.MouseEvent) {
    const pos = toPercent(e.clientX, e.clientY);
    if (tool === 'add-room' && drawStart) { setDrawEnd(pos); return; }
    if (tool === 'add-wall' && wallStart) { setWallPreviewEnd(pos); return; }
  }

  function handleUp() {
    if (tool === 'add-room' && drawStart && drawEnd) {
      const x = Math.min(drawStart.x, drawEnd.x);
      const y = Math.min(drawStart.y, drawEnd.y);
      const w = Math.abs(drawEnd.x - drawStart.x);
      const h = Math.abs(drawEnd.y - drawStart.y);
      if (w > 0.5 && h > 0.5) { setNamingRoom({ x, y, w, h }); setNewRoomName(''); }
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
    setRoomDrag(null); roomDragRef.current = null; setRoomMousePos(null);
  }

  function startRoomDrag(e: React.MouseEvent, kind: RoomDrag['kind'], id: number, ox: number, oy: number, extra?: Partial<RoomDrag>) {
    if (tool !== 'idle') return;
    e.preventDefault(); e.stopPropagation();
    const pos = toPercent(e.clientX, e.clientY);
    const drag = { kind, id, mouseStartX: pos.x, mouseStartY: pos.y, origX: ox, origY: oy, ...extra };
    setRoomDrag(drag);
    roomDragRef.current = drag;
    setRoomMousePos(pos);
  }

  // ========== CRUD ==========

  async function addTable(px: number, py: number) {
    const maxN = tables.reduce((m, t) => Math.max(m, t.tableNumber), 0);
    const zone = addZone || rooms[0]?.name || 'Main';
    await createNewTable({ tableNumber: maxN + 1, seats: addSeats, zone, posX: px, posY: py });
    setTool('idle');
    onTablesChange();
  }

  async function handleAddElement(px: number, py: number) {
    const icon = ELEMENT_ICONS[addElemType] ?? addElemType;
    await apiCreateElement({
      type: addElemType, name: icon,
      posX: px, posY: py, width: 8, height: 5, rotation: 0,
    });
    setTool('idle');
    onElementsChange();
  }

  async function saveNewRoom() {
    if (!namingRoom || !newRoomName.trim()) return;
    const saved = await apiCreateRoom({
      name: newRoomName.trim(),
      x: namingRoom.x, y: namingRoom.y, w: namingRoom.w, h: namingRoom.h,
    });
    setRooms(p => [...p, { id: saved.id, name: saved.name, x: saved.x, y: saved.y, w: saved.w, h: saved.h }]);
    setNamingRoom(null); setNewRoomName(''); setTool('idle');
  }

  async function handleDeleteRoom(id: number) {
    await apiDeleteRoom(id);
    setRooms(p => p.filter(r => r.id !== id));
  }

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

  function openTableEdit(table: RestaurantTable) {
    setEditingElement(null);
    setEditingTable(table); setEditSeats(table.seats); setEditZone(table.zone);
    setEditWindow(table.windowSeat); setEditPrivate(table.privateArea);
    setEditPlayground(table.nearPlayground); setEditAccessible(table.accessible); setEditStage(table.nearStage);
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
    if (!window.confirm(t('admin.resetConfirm'))) return;
    setTableShapes({});
    setEditingTable(null); setEditingElement(null); setEditingRoomId(null); setSelectedWallId(null);
    await deleteAllTables();
    await deleteAllElements();
    await deleteAllRooms();
    await deleteAllWalls();
    setRooms([]);
    onTablesChange(); onElementsChange(); onWallsChange();
  }

  // ========== DRAWING PREVIEW ==========

  const drawRect = drawStart && drawEnd ? {
    x: Math.min(drawStart.x, drawEnd.x), y: Math.min(drawStart.y, drawEnd.y),
    w: Math.abs(drawEnd.x - drawStart.x), h: Math.abs(drawEnd.y - drawStart.y),
  } : null;

  const cursor = tool === 'add-room' ? 'cursor-crosshair' : tool === 'add-wall' ? 'cursor-crosshair' : tool !== 'idle' ? 'cursor-cell' : '';

  return (
    <div className="admin-view">
      <div className="admin-toolbar">
        <button className={`admin-tool-btn ${tool === 'add-room' ? 'active' : ''}`}
          onClick={() => setTool(tool === 'add-room' ? 'idle' : 'add-room')}>{t('admin.addRoom')}</button>

        <div className="admin-tool-group">
          <button className={`admin-tool-btn ${tool === 'add-table' ? 'active' : ''}`}
            onClick={() => setTool(tool === 'add-table' ? 'idle' : 'add-table')}>{t('admin.addTable')}</button>
          {tool === 'add-table' && (
            <div className="admin-inline-form">
              <select value={addSeats} onChange={e => setAddSeats(+e.target.value)}>
                {[2, 4, 6, 8, 10].map(n => <option key={n} value={n}>{t('admin.seats', { count: n })}</option>)}
              </select>
              <select value={addShape} onChange={e => setAddShape(e.target.value as 'square' | 'circle')}>
                <option value="square">&#9633; {t('admin.square')}</option>
                <option value="circle">&#9675; {t('admin.circle')}</option>
              </select>
              <select value={addZone} onChange={e => setAddZone(e.target.value)}>
                {rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="admin-tool-group">
          <button className={`admin-tool-btn ${tool === 'add-element' ? 'active' : ''}`}
            onClick={() => setTool(tool === 'add-element' ? 'idle' : 'add-element')}>{t('admin.addElement')}</button>
          {tool === 'add-element' && (
            <div className="admin-inline-form">
              <select value={addElemType} onChange={e => setAddElemType(e.target.value)}>
                {ELEMENT_TYPE_KEYS.map(key => <option key={key} value={key}>{t(`elementType.${key}`)}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="admin-tool-group">
          <button className={`admin-tool-btn ${tool === 'add-wall' ? 'active' : ''}`}
            onClick={() => { setTool(tool === 'add-wall' ? 'idle' : 'add-wall'); setWallStart(null); setWallPreviewEnd(null); }}>{t('admin.addWall')}</button>
          {tool === 'add-wall' && (
            <div className="admin-inline-form">
              <input type="color" value={wallColor} onChange={e => setWallColor(e.target.value)}
                title={t('admin.wallColor')} className="admin-color-input" />
              <select value={wallThickness} onChange={e => setWallThickness(+e.target.value)}>
                <option value={2}>2px</option>
                <option value={4}>4px</option>
                <option value={6}>6px</option>
              </select>
            </div>
          )}
        </div>

        <button className="admin-tool-btn admin-reset-btn" onClick={handleReset}>&#128465; {t('admin.reset')}</button>

        {saveMsg && <span className="admin-save-msg">{saveMsg}</span>}

        {tool !== 'idle' && (
          <span className="admin-hint">
            {tool === 'add-room' && t('admin.hintRoom')}
            {tool === 'add-table' && t('admin.hintTable')}
            {tool === 'add-element' && t('admin.hintElement')}
            {tool === 'add-wall' && t('admin.hintWall')}
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
                <button className="admin-item-delete" onMouseDown={e => { e.stopPropagation(); handleDeleteRoom(room.id); }}>&times;</button>
                {RESIZE_HANDLES.map(h => (
                  <div key={h} className={`resize-handle rh-${h}`}
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); const pos = toPercent(e.clientX, e.clientY); const drag = { kind: 'room-resize' as const, id: room.id, mouseStartX: pos.x, mouseStartY: pos.y, origX: 0, origY: 0, handle: h, origRoom: { ...room } }; setRoomDrag(drag); roomDragRef.current = drag; setRoomMousePos(pos); }} />
                ))}
              </div>
            );
          })}

          {/* Draw preview */}
          {drawRect && <div className="room-draw-preview" style={{ left: `${drawRect.x}%`, top: `${drawRect.y}%`, width: `${drawRect.w}%`, height: `${drawRect.h}%` }} />}

          {/* Walls SVG overlay */}
          <svg className="admin-walls-svg" aria-hidden="true">
            {walls.map(wall => (
              <g key={wall.id}>
                {/* Wider invisible hit target */}
                <line
                  x1={`${wall.x1}%`} y1={`${wall.y1}%`}
                  x2={`${wall.x2}%`} y2={`${wall.y2}%`}
                  stroke="transparent" strokeWidth={8}
                  style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                  onMouseDown={e => { e.stopPropagation(); setSelectedWallId(wall.id); }}
                />
                <line
                  x1={`${wall.x1}%`} y1={`${wall.y1}%`}
                  x2={`${wall.x2}%`} y2={`${wall.y2}%`}
                  stroke={wall.color} strokeWidth={wall.thickness}
                  strokeLinecap="round"
                  className={`admin-wall ${selectedWallId === wall.id ? 'admin-wall-selected' : ''}`}
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            ))}
            {/* Wall draw preview */}
            {wallStart && wallPreviewEnd && (
              <line
                x1={`${wallStart.x}%`} y1={`${wallStart.y}%`}
                x2={`${wallPreviewEnd.x}%`} y2={`${wallPreviewEnd.y}%`}
                stroke={wallColor} strokeWidth={wallThickness}
                strokeLinecap="round" strokeDasharray="6 4"
                style={{ pointerEvents: 'none', opacity: 0.6 }}
              />
            )}
          </svg>

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
                  title={t('admin.resizeTooltip')} />
                {/* Rotation handle (top center) */}
                <div className="elem-rotate-handle"
                  onMouseDown={e => startElemRotate(e, elem)}
                  title={t('admin.rotateTooltip')}>&#x21bb;</div>
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
                title={t('admin.tableTooltip', { number: table.tableNumber, seats: table.seats })}>
                <span className="table-number">{table.tableNumber}</span>
                <span className="table-seats">{table.seats}</span>
                <button className="admin-delete-btn" onMouseDown={e => handleDeleteTable(e, table.id)} title={t('admin.deleteTable')}>&times;</button>
              </div>
            );
          })}
        </div>

        {/* Room naming */}
        {namingRoom && (
          <div className="room-name-popup">
            <label>{t('admin.roomName')}</label>
            <input autoFocus value={newRoomName} onChange={e => setNewRoomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveNewRoom()} placeholder={t('admin.roomPlaceholder')} />
            <div className="room-name-actions">
              <button onClick={saveNewRoom} className="admin-tool-btn active">{t('admin.save')}</button>
              <button onClick={() => { setNamingRoom(null); setTool('idle'); }} className="admin-tool-btn">{t('admin.cancel')}</button>
            </div>
          </div>
        )}

        {/* Table edit panel */}
        {editingTable && (
          <div className="admin-edit-panel">
            <h3>{t('admin.tableNumber', { number: editingTable.tableNumber })}</h3>
            <div className="admin-edit-form">
              <label>{t('admin.seatsLabel')}<select value={editSeats} onChange={e => setEditSeats(+e.target.value)}>
                {[2, 4, 6, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}
              </select></label>
              <label>{t('admin.zoneLabel')}<select value={editZone} onChange={e => setEditZone(e.target.value)}>
                {rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select></label>
              <div className="admin-checkboxes">
                <label><input type="checkbox" checked={editWindow} onChange={e => setEditWindow(e.target.checked)} /> {t('admin.windowSeat')}</label>
                <label><input type="checkbox" checked={editPrivate} onChange={e => setEditPrivate(e.target.checked)} /> {t('admin.private')}</label>
                <label><input type="checkbox" checked={editPlayground} onChange={e => setEditPlayground(e.target.checked)} /> {t('admin.playground')}</label>
                <label><input type="checkbox" checked={editAccessible} onChange={e => setEditAccessible(e.target.checked)} /> {t('admin.accessible')}</label>
                <label><input type="checkbox" checked={editStage} onChange={e => setEditStage(e.target.checked)} /> {t('admin.nearStage')}</label>
              </div>
              <div className="admin-edit-actions">
                <button onClick={saveTableEdit} className="admin-tool-btn active">{t('admin.save')}</button>
                <button onClick={() => setEditingTable(null)} className="admin-tool-btn">{t('admin.close')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Element edit panel */}
        {editingElement && (
          <div className="admin-edit-panel">
            <h3>{t('admin.element', { type: editingElement.type })}</h3>
            <div className="admin-edit-form">
              <label>{t('admin.elemName')}
                <input type="text" value={editElemName} onChange={e => setEditElemName(e.target.value)}
                  className="admin-edit-input" />
              </label>
              <label>{t('admin.elemWidth')}
                <input type="number" value={editElemWidth} onChange={e => setEditElemWidth(+e.target.value)}
                  min={1} max={100} step={0.5} className="admin-edit-input" />
              </label>
              <label>{t('admin.elemHeight')}
                <input type="number" value={editElemHeight} onChange={e => setEditElemHeight(+e.target.value)}
                  min={1} max={100} step={0.5} className="admin-edit-input" />
              </label>
              <label>{t('admin.elemRotation')}
                <div className="admin-rotation-control">
                  <input type="range" min={0} max={360} value={editElemRotation}
                    onChange={e => setEditElemRotation(+e.target.value)} />
                  <span className="admin-rotation-value">{editElemRotation}&deg;</span>
                </div>
              </label>
              <div className="admin-edit-actions">
                <button onClick={saveElemEdit} className="admin-tool-btn active">{t('admin.save')}</button>
                <button onClick={() => setEditingElement(null)} className="admin-tool-btn">{t('admin.close')}</button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
