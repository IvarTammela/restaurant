# 3D Restorani Põrandaplaan — Disainispetsifikatsioon

## Ülevaade

Lisada restorani broneerimissüsteemile interaktiivne 3D vaade, kus kasutaja näeb restorani ruumi Three.js abil ja saab laudu broneerida otse 3D vaates. Projekt on jagatud kahte faasi.

## Faas A — 3D vaade (see spec)

Lisada Three.js-põhine 3D restorani vaade olemasoleva 2D plaani kõrvale. Kasutaja ja admin saavad lülitada 2D ⇄ 3D vahel.

## Faas B — Ruumi ehitaja (tulevane spec)

Admin saab restorani nullist üles ehitada: tsoonide CRUD, seinte joonistamine, elementide paigutamine. Ei kuulu siia spec'i.

---

## Tehnilised otsused

| Otsus | Valik | Põhjendus |
|-------|-------|-----------|
| 3D mootor | Three.js via @react-three/fiber | React-native integratsioon, suur ökosüsteem |
| Kaamera | OrbitControls (@react-three/drei) | Intuitiivne, töötab mobiilil |
| Mudelid | Protseduuriline geomeetria → GLTF upgrade | Alustame koodist, lisame mudelid hiljem |
| Materjalid | MeshStandardMaterial (PBR) | Realistlik valgus/varjud ilma keerukuseta |
| Admin 3D | Read-only eelvaade | Admin redigeerib 2D-s, 3D on ainult kontrollimiseks |

## Komponentide struktuur

```
src/components/
├── FloorPlanWrapper.tsx       // 2D ⇄ 3D toggle + ühine state
├── FloorPlan.tsx              // olemasolev 2D vaade (muutumatu)
├── FloorPlan3D.tsx            // R3F Canvas + Scene
│   ├── Room.tsx               // seinad, põrand, lagi, aknad, uksed
│   ├── Table3D.tsx            // üks laud (geomeetria + materjal)
│   ├── Furniture.tsx          // baar, lava, köök, WC, mängunurk
│   └── Lighting.tsx           // ambient + directional + akna valgus
├── AdminFloorPlan.tsx         // olemasolev 2D admin (muutumatu)
└── AdminFloorPlanWrapper.tsx  // admin 2D + 3D eelvaade toggle
```

## Andmevoog

### Koordinaatide teisendus

Backend annab laudade positsiooni protsentidena (posX/posY: 0-100). 3D vaade teisendab need Three.js world koordinaatideks:

```
ROOM_WIDTH = 20  // Three.js ühikud
ROOM_DEPTH = 15  // aspektsuhe 4:3 nagu 2D plaan

worldX = (posX / 100) * ROOM_WIDTH - ROOM_WIDTH / 2
worldZ = (posY / 100) * ROOM_DEPTH - ROOM_DEPTH / 2
worldY = 0  // põrandal
```

### State management

FloorPlanWrapper hoiab:
- `viewMode: '2d' | '3d'` — kasutaja valik
- Edastab samad props mõlemale vaatele (tables, recommendations, reservations, floorElements)
- Klõps laual 3D-s → sama `onSelectTable` callback kui 2D-s

### Admin voog

1. Admin redigeerib 2D-s (drag, atribuudid) — olemasolev loogika
2. Admin vajutab "3D eelvaade" → näeb read-only 3D vaadet
3. Admin naaseb 2D-sse redigeerimise jätkamiseks

## 3D Ruumi disain

### Tsoonid

| Tsoon | Põrand | Seinad | Lagi | Eripära |
|-------|--------|--------|------|---------|
| Sisesaal | Tume puit | Kreem/beež | Valge | Aknad vasakul + paremal, lava ülemises vasakus nurgas |
| Terrass | Hall kivi | Madalad piirded | Avatud (taevas) | Avatud õhk, taime elemendid |
| Privaatruumid | Tume puit | Tumedamad seinad | Madalam lagi | Vaheseintega eraldatud |

### Mööbel

| Element | 3D kuju | Materjal |
|---------|---------|----------|
| Laud (2 kohta) | Silinder d=0.8, h=0.75 | Hele puit |
| Laud (4 kohta) | Silinder d=1.0, h=0.75 | Hele puit |
| Laud (6+ kohta) | Kast 1.4x0.9, h=0.75 | Hele puit |
| Tool | Kast 0.4x0.4, h=0.45 + seljatugi | Tume puit |
| Baar | Kast pikk, h=1.1 | Tume puit + metallikaunistus |
| Lava | Platvorm h=0.3 | Tume puit |

### Valgustus

- AmbientLight: intensiivsus 0.4, soe toon (#ffeedd)
- DirectionalLight: intensiivsus 0.8, positsioon ülevalt-paremalt, varjud sees
- Akna valgus: RectAreaLight iga akna kohal, sinine toon (#cce0ff)
- Terrass: tugevam ambient (0.6), suunaline valgus simuleerib päikest

## Laua interaktsioon 3D-s

- **Hover**: laud tõuseb 2cm üles (animatsioon), kursor muutub pointer'iks
- **Available**: roheline glow (emissive)
- **Occupied**: punane toon, ei reageeri hover'ile
- **Recommended**: oranž glow + kerge pulseerimine
- **Selected**: roheline glow + tõstetud kõrgemale
- **Click**: avab sama broneerimise modaali kui 2D vaates

## 2D ⇄ 3D Toggle

- Nupp asub legend-riba paremal pool
- Ikoon: kuubiku/ruudu ikoon
- Üleminek: fade out 2D → fade in 3D (300ms)
- 3D vaade võtab sama ruumi mis 2D plaan (sama container)
- Mobiilil: toggle töötab, OrbitControls toetab touch gestures

## NPM sõltuvused

```json
{
  "three": "^0.168.0",
  "@react-three/fiber": "^8.17.0",
  "@react-three/drei": "^9.114.0"
}
```

## Implementeerimise järjekord

1. **NPM install + basic setup**: lisa sõltuvused, loo FloorPlan3D.tsx tühi Canvas
2. **Room.tsx**: põrand + seinad + lagi geomeetria, materjaalid, tsoonide eristamine
3. **Lighting.tsx**: ambient + directional + akna valgused
4. **Table3D.tsx**: lauad geomeetriast, staatuse värvid, hover/click
5. **Furniture.tsx**: baar, lava, köök, WC elemendid
6. **FloorPlanWrapper.tsx**: 2D ⇄ 3D toggle loogika
7. **AdminFloorPlanWrapper.tsx**: admin eelvaade toggle
8. **Polish**: animatsioonid, loading state, mobiil-tugi

## Demo andmed

"La Maison" on eellaetud näidisrestoran (praegune DataInitializer). 3D vaade kasutab samu andmeid — muudatusi backend-is ei ole vaja.

## Väljajäetud (Faas B)

- Tsoonide CRUD (lisa/kustuta/muuda)
- Seinte joonistamine
- Ruumi nullist ülesehitamine
- GLTF mudelite import (upgrade protseduuriliselt)
