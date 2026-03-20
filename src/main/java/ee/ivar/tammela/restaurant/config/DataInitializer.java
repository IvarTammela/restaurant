package ee.ivar.tammela.restaurant.config;

import ee.ivar.tammela.restaurant.model.FloorElement;
import ee.ivar.tammela.restaurant.model.Reservation;
import ee.ivar.tammela.restaurant.model.RestaurantTable;
import ee.ivar.tammela.restaurant.model.Room;
import ee.ivar.tammela.restaurant.repository.FloorElementRepository;
import ee.ivar.tammela.restaurant.repository.ReservationRepository;
import ee.ivar.tammela.restaurant.repository.RoomRepository;
import ee.ivar.tammela.restaurant.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.security.SecureRandom;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final String ZONE_SISESAAL = "Sisesaal";
    private static final String ZONE_TERRASS = "Terrass";
    private static final String ZONE_PRIVAATRUUMID = "Privaatruumid";
    private static final String ELEMENT_WINDOW = "window";

    private final TableRepository tableRepository;
    private final ReservationRepository reservationRepository;
    private final FloorElementRepository floorElementRepository;
    private final RoomRepository roomRepository;
    private final SecureRandom random = new SecureRandom();

    @Override
    public void run(String... args) {
        createRooms();
        createTables();
        createFloorElements();
        createRandomReservations();
    }

    private void createRooms() {
        roomRepository.save(Room.builder().name(ZONE_SISESAAL).x(0).y(0).width(52).height(72).build());
        roomRepository.save(Room.builder().name(ZONE_TERRASS).x(54).y(0).width(46).height(72).build());
        roomRepository.save(Room.builder().name(ZONE_PRIVAATRUUMID).x(0).y(74).width(100).height(26).build());
    }

    private void createTables() {
        // Sisesaal - vasakpoolne sein (akna ääres)
        saveTable(new TableParams(1, 2, 5, 25, ZONE_SISESAAL, true, false, false, true, false));
        saveTable(new TableParams(2, 2, 5, 40, ZONE_SISESAAL, true, false, false, false, false));
        saveTable(new TableParams(3, 4, 5, 55, ZONE_SISESAAL, true, false, false, false, false));
        saveTable(new TableParams(4, 2, 18, 60, ZONE_SISESAAL, false, false, true, false, false));
        // Sisesaal - keskel
        saveTable(new TableParams(5, 6, 22, 25, ZONE_SISESAAL, false, false, false, true, false));
        saveTable(new TableParams(6, 6, 22, 45, ZONE_SISESAAL, false, false, false, true, false));
        saveTable(new TableParams(7, 4, 35, 60, ZONE_SISESAAL, false, false, true, true, false));
        // Sisesaal - parempoolne sein (akna ääres, lava lähedal)
        saveTable(new TableParams(8, 2, 42, 20, ZONE_SISESAAL, true, false, false, false, true));
        saveTable(new TableParams(9, 4, 42, 38, ZONE_SISESAAL, true, false, false, false, false));
        saveTable(new TableParams(10, 8, 42, 58, ZONE_SISESAAL, false, false, true, true, true));

        // Terrass - vasakpoolne rida
        saveTable(new TableParams(11, 2, 62, 15, ZONE_TERRASS, false, false, false, false, false));
        saveTable(new TableParams(12, 4, 62, 35, ZONE_TERRASS, false, false, false, true, false));
        saveTable(new TableParams(13, 4, 62, 55, ZONE_TERRASS, false, false, false, false, false));
        // Terrass - parempoolne rida
        saveTable(new TableParams(14, 6, 82, 20, ZONE_TERRASS, false, false, false, false, false));
        saveTable(new TableParams(15, 6, 82, 40, ZONE_TERRASS, false, false, false, true, false));
        saveTable(new TableParams(16, 2, 82, 58, ZONE_TERRASS, false, false, false, false, false));

        // Privaatruumid - ülemine rida
        saveTable(new TableParams(17, 4, 10, 85, ZONE_PRIVAATRUUMID, false, true, false, false, false));
        saveTable(new TableParams(18, 6, 25, 85, ZONE_PRIVAATRUUMID, false, true, false, false, false));
        saveTable(new TableParams(19, 8, 42, 85, ZONE_PRIVAATRUUMID, false, true, false, true, false));
        saveTable(new TableParams(20, 10, 58, 85, ZONE_PRIVAATRUUMID, false, true, false, true, false));
        // Privaatruumid - parempoolne osa
        saveTable(new TableParams(21, 2, 72, 82, ZONE_PRIVAATRUUMID, false, true, false, false, false));
        saveTable(new TableParams(22, 2, 82, 82, ZONE_PRIVAATRUUMID, false, true, false, false, false));
        saveTable(new TableParams(23, 4, 72, 92, ZONE_PRIVAATRUUMID, false, true, false, false, false));
        saveTable(new TableParams(24, 4, 82, 92, ZONE_PRIVAATRUUMID, false, true, false, false, false));
    }

    private void saveTable(TableParams p) {
        tableRepository.save(RestaurantTable.builder()
                .tableNumber(p.number).seats(p.seats)
                .posX(p.posX).posY(p.posY).zone(p.zone)
                .windowSeat(p.window).privateArea(p.priv)
                .nearPlayground(p.playground).accessible(p.accessible)
                .nearStage(p.nearStage).build());
    }

    private record TableParams(int number, int seats, double posX, double posY, String zone,
                                boolean window, boolean priv, boolean playground,
                                boolean accessible, boolean nearStage) {}

    private void createFloorElements() {
        //                          type          name              posX  posY  width height rotation
        // Lava ja baar
        floorElementRepository.save(new FloorElement("stage",      "\uD83C\uDFB5 LAVA",     2,   2,   15,  7,  0));
        floorElementRepository.save(new FloorElement("bar",        "BAAR",           90,  2,   8,   5,  0));
        // Köök ja mänguala
        floorElementRepository.save(new FloorElement("kitchen",    "K\u00D6KK",      2,   92,  8,   5,  0));
        floorElementRepository.save(new FloorElement("playground", "\uD83E\uDDF8",   96,  94,  4,   5,  0));

        // Aknad (window) — saali sees, seinte ääres
        floorElementRepository.save(new FloorElement(ELEMENT_WINDOW, "Vaade t\u00E4navale",   1,   20,  1.5,  40,  0));
        floorElementRepository.save(new FloorElement(ELEMENT_WINDOW, "Vaade sisehoovi",       51,  15,  1.5,  35,  0));
        floorElementRepository.save(new FloorElement(ELEMENT_WINDOW, "Vaade terrassile",      97,  15,  1.5,  50,  0));

        // Uksed (door)
        floorElementRepository.save(new FloorElement("door",       "\u2192 V\u00E4lisuks",  24,  70,  4,   2,  0));
        floorElementRepository.save(new FloorElement("door",       "Uks terrassile",        50,  66,  5,   2,  0));

        // Rajatised (facility)
        floorElementRepository.save(new FloorElement("facility",   "\uD83D\uDCB0 Kassa",    90,  8,   8,   4,  0));
        floorElementRepository.save(new FloorElement("facility",   "\uD83D\uDEBB WC",       92,  90,  6,   5,  0));
    }

    private void createRandomReservations() {
        List<RestaurantTable> tables = tableRepository.findAll();
        LocalDate today = LocalDate.now();

        String[] names = {"Mari Mets", "Jaan Tamm", "Kati Kask", "Peeter Paju",
                "Liisa Lepp", "Andres Allik", "Piret Parn", "Toomas Teder",
                "Kadri Kuusk", "Mart Mand"};

        // Generate reservations for today and tomorrow
        for (int dayOffset = 0; dayOffset <= 1; dayOffset++) {
            LocalDate date = today.plusDays(dayOffset);

            // Create 6-8 random reservations per day
            int reservationCount = 6 + random.nextInt(3);
            for (int i = 0; i < reservationCount; i++) {
                RestaurantTable table = tables.get(random.nextInt(tables.size()));
                int hour = 11 + random.nextInt(9); // 11:00 - 19:00
                LocalTime startTime = LocalTime.of(hour, 0);
                LocalTime endTime = startTime.plusHours(2);
                String name = names[random.nextInt(names.length)];
                int partySize = 1 + random.nextInt(table.getSeats());

                // Check for overlap before saving
                boolean overlaps = reservationRepository
                        .findOverlapping(date, startTime, endTime)
                        .stream()
                        .anyMatch(r -> r.getTable().getId().equals(table.getId()));

                if (!overlaps) {
                    reservationRepository.save(
                            new Reservation(table, name, date, startTime, endTime, partySize));
                }
            }
        }
    }
}
