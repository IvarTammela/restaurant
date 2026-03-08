# 🍽️ La Maison — Restorani Reserveerimissüsteem

> CGI Suvepraktika 2026 proovitöö — Ivar Tammela

[![SonarCloud](https://sonarcloud.io/api/project_badges/measure?project=IvarTammela_restaurant&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=IvarTammela_restaurant)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=IvarTammela_restaurant&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=IvarTammela_restaurant)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=IvarTammela_restaurant&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=IvarTammela_restaurant)

---

## Ülevaade

Veebirakendus restorani laudade broneerimiseks ja haldamiseks. Külastaja näeb visuaalset saaliplaani, saab filtreerida vabu laudu ning rakendus soovitab sobivaimat lauda seltskonna suuruse ja eelistuste põhjal.

---

## Funktsionaalsus

### Külastaja vaade
- **Visuaalne saaliplaaan** — lauad kolmes tsoonis: Sisesaal, Terrass, Privaatruumid
- **Filtreerimine** — kuupäev, kellaaeg, seltskonna suurus, tsoon
- **Eelistused** — akna all, privaatne nurk, mängunurga lähedal, ligipääsetav, lava lähedal
- **Soovitusalgoritm** — skooripõhine (max 102p): suuruse sobivus + eelistused
- **Laudade liitmine** — suurele seltskonnale (>10) soovitatakse kahte kõrvuti asuvat lauda
- **Broneerimine** — laual klikk → modaal → kinnita broneering

### Admin vaade
- **Drag & drop** — laudade lohistamine ja automaatne salvestamine
- **Lisa laud** — vali kohtade arv ja tsoon, kliki saaliplaanile
- **Lisa ruum** — joonista hiirega uus tsoon, anna nimi
- **Lisa element** — Baar, Köök, Lava, Uks, Aken, Mängunurk
- **Elementide muutmine** — kliki elemendil → muuda nime, suurust, pöördenurka
- **Resize & rotate** — nurga ja pöörlemise handle'id

---

## Tehnoloogiad

| Kiht | Tehnoloogia |
|------|-------------|
| Backend | Spring Boot 3.5.11, Java 21 |
| Andmebaas | H2 in-memory |
| Frontend | React 19, TypeScript, Vite |
| Stiilid | CSS (custom dark gold teema) |
| Versioonikontroll | Git + GitHub |
| Koodikvaliteet | SonarCloud (Security A, Reliability A, Maintainability A) |

---

## Käivitamine

### Eeldused
- Java 21+
- Node.js 18+

### Backend
```bash
./mvnw spring-boot:run
```
Backend käivitub aadressil: `http://localhost:8080`

H2 konsool: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:restaurant`
- Username: `sa`
- Password: *(tühi)*

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend käivitub aadressil: `http://localhost:5173`

---

## API endpointid

| Meetod | URL | Kirjeldus |
|--------|-----|-----------|
| GET | `/api/tables` | Kõik lauad |
| GET | `/api/tables/available` | Vabad lauad filtritega |
| GET | `/api/tables/recommend` | Soovitused skoorimisega |
| POST | `/api/tables` | Uus laud |
| PUT | `/api/tables/{id}` | Uuenda lauda |
| PUT | `/api/tables/{id}/position` | Uuenda laua asukohta |
| DELETE | `/api/tables/{id}` | Kustuta laud |
| GET | `/api/reservations` | Kõik broneeringud |
| POST | `/api/reservations` | Uus broneering |
| GET | `/api/rooms` | Kõik tsoonid |
| GET | `/api/elements` | Kõik saali elemendid |
| POST | `/api/elements` | Uus element |
| PUT | `/api/elements/{id}` | Uuenda elementi |
| DELETE | `/api/elements/{id}` | Kustuta element |

---

## Soovitusalgoritm

Iga vaba laud saab skoori (max 102 punkti):

**Suuruse sobivus (max 50p):**
- `seats == partySize` → 50p
- `seats == partySize + 1` → 42p
- `seats == partySize + 2` → 34p
- Iga liigne koht vähendab skoori 8p võrra (nt 4-liikmelisele seltskonnale 10-kohalisel laual on suuruse skoor 2p)

**Eelistused (max 50p):**
- Akna all → +10p
- Privaatne nurk → +10p
- Mängunurga lähedal → +10p
- Ligipääsetav → +10p
- Lava lähedal → +10p

**Ligipääsetavuse boonus:** +2p (alati, kui laud on ligipääsetav)

**Laudade liitmine:** kui `partySize > 10`, otsitakse kaks kõrvuti asuvat vaba lauda (Eukleidiline kaugus < 35%) ja soovitatakse neid kombinatsioonina.

---

## Projekti struktuur

```
restaurant/
├── src/main/java/ee/ivar/tammela/restaurant/
│   ├── config/          # DataInitializer, WebConfig (CORS)
│   ├── controller/      # REST kontrollerid
│   ├── dto/             # Andmeedastuse objektid
│   ├── model/           # JPA entiteedid
│   ├── repository/      # Spring Data repositooriumid
│   └── service/         # Äriloogika
└── frontend/src/
    ├── components/
    │   ├── FilterPanel.tsx       # Filtrite paneel
    │   ├── FloorPlan.tsx         # Visuaalne saaliplaaan
    │   ├── AdminFloorPlan.tsx    # Admin vaade
    │   └── ReservationModal.tsx  # Broneerimise modaal
    ├── api.ts           # API kliendi funktsioonid
    └── types.ts         # TypeScript tüübid
```

---

## Ajakulu ja märkmed

**Kokku:** ~8 tundi (ühe õhtu + hommiku töö)

### Mis oli keeruline

**Spring Boot õppimine nullist** — Java/Spring Boot kogemus puudus enne seda projekti. Suurim väljakutse oli JPA annotationid (`@Entity`, `@ManyToOne`, `@JoinColumn`) ja Spring-ile omane dependency injection mõistmine. Abi sain Spring Boot ametlikust dokumentatsioonist ja Baeldung tutorialitest.

**Drag & drop admin vaates** — esimene katse kasutas HTML5 native drag & drop API-t, mis ei töötanud korrektselt (hiire lahkumine elemendilt katkestas lohistamise). Lahendasin ümber kirjutades `document`-tasemel `mousemove`/`mouseup` event listeneritega ja `useRef` hook-iga stale closure probleemide vältimiseks.

**Soovitusalgoritmi kalibreerimine** — esialgu soovitas algoritm 4-liikmelisele seltskonnale 10-kohalist lauda kui see oli kõrgema skooriga. Parandasin karistussüsteemi et liiga suured lauad saaksid oluliselt madalama skoori.

**CORS seadistus** — backend port 8080 ja frontend port 5173, Spring Boot CORS ei lubanud päringuid. Lahendus: `WebConfig.java` klass `@Configuration` annotationiga.

### Lahendamata probleemid

- **Broneeringute persistence** — H2 on in-memory andmebaas, kõik broneeringud kaovad serveri taaskäivitusel. Tootmiskeskkonnas tuleks kasutada PostgreSQL-i või MySQL-i.
- **Autentimine** — admin vaade on praegu kõigile ligipääsetav. Tootmises peaks olema JWT-põhine autentimine.
- **Mobiilivaade** — UI on optimeeritud desktop kasutamiseks.

### Eeldused ülesande tõlgendamisel

- "Juhuslikult genereeritud broneeringud" — DataInitializer loob ~12-16 juhuslikku broneeringut käivitamisel
- `"Kõrvuti asuvad lauad"` — lauad mis on saaliplaanilt vaadates füüsiliselt üksteise kõrval
- "Keskmine külastuse aeg" — endTime = startTime + 2h (kõvakodeeritud)

---

## AI tööriistade kasutamine

Projekt on arendatud kasutades **Claude AI** (Anthropic) assistenti:

- **Arhitektuur ja planeerimine** — Claude aitas planeerida projekti struktuuri ja tehnilist lahendust
- **Spring Boot kood** — kuna Java/Spring Boot kogemus puudus, genereeris Claude backendi põhikoodi (mudelid, kontrollerid, serviceud). Mina vaatasin koodi üle, mõistsin struktuuri ja andsin juhiseid muudatusteks.
- **Frontend komponendid** — React komponendid genereeriti AI abiga, CSS disain (dark gold teema) on Claude loodud minu juhiste järgi
- **Veavõtted** — SonarQube issues lahendamisel kasutasin Claude abi konkreetsete paranduste tegemisel

**Minu panus:**
- Kogu projekti kontseptsioon ja funktsionaalsuse disain
- Kõigi genereeritud lahenduste ülevaatus ja kinnitamine
- Visuaalne disain ja UI/UX otsused
- Vigade tuvastamine ja paranduste juhtimine
- Admin vaate kontseptsioon (drag & drop, ruumide loomine)
- SonarQube integreerimine ja koodikvaliteedi tagamine

---

## SonarCloud

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=IvarTammela_restaurant&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=IvarTammela_restaurant)

Projekt läbib SonarCloud quality gate kõigi A-reitingutega:
- Security: A (0 haavatavust)
- Reliability: A (0 bugi)
- Maintainability: A (mõned code smells)
- Hotspots Reviewed: 100%
- Duplications: 0.0%
