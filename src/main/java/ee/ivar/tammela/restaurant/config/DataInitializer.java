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
        roomRepository.save(Room.builder().name("Sisesaal").x(0).y(0).width(52).height(72).build());
        roomRepository.save(Room.builder().name("Terrass").x(54).y(0).width(46).height(72).build());
        roomRepository.save(Room.builder().name("Privaatruumid").x(0).y(74).width(100).height(26).build());
    }

    private void createTables() {
        // Sisesaal - vasakpoolne sein (akna ääres)
        saveTable(1, 2, 5, 25, "Sisesaal", true, false, false, true, false);
        saveTable(2, 2, 5, 40, "Sisesaal", true, false, false, false, false);
        saveTable(3, 4, 5, 55, "Sisesaal", true, false, false, false, false);
        saveTable(4, 2, 18, 60, "Sisesaal", false, false, true, false, false);
        // Sisesaal - keskel
        saveTable(5, 6, 22, 25, "Sisesaal", false, false, false, true, false);
        saveTable(6, 6, 22, 45, "Sisesaal", false, false, false, true, false);
        saveTable(7, 4, 35, 60, "Sisesaal", false, false, true, true, false);
        // Sisesaal - parempoolne sein (akna ääres, lava lähedal)
        saveTable(8, 2, 42, 20, "Sisesaal", true, false, false, false, true);
        saveTable(9, 4, 42, 38, "Sisesaal", true, false, false, false, false);
        saveTable(10, 8, 42, 58, "Sisesaal", false, false, true, true, true);

        // Terrass - vasakpoolne rida
        saveTable(11, 2, 62, 15, "Terrass", false, false, false, false, false);
        saveTable(12, 4, 62, 35, "Terrass", false, false, false, true, false);
        saveTable(13, 4, 62, 55, "Terrass", false, false, false, false, false);
        // Terrass - parempoolne rida
        saveTable(14, 6, 82, 20, "Terrass", false, false, false, false, false);
        saveTable(15, 6, 82, 40, "Terrass", false, false, false, true, false);
        saveTable(16, 2, 82, 58, "Terrass", false, false, false, false, false);

        // Privaatruumid - ülemine rida
        saveTable(17, 4, 10, 85, "Privaatruumid", false, true, false, false, false);
        saveTable(18, 6, 25, 85, "Privaatruumid", false, true, false, false, false);
        saveTable(19, 8, 42, 85, "Privaatruumid", false, true, false, true, false);
        saveTable(20, 10, 58, 85, "Privaatruumid", false, true, false, true, false);
        // Privaatruumid - parempoolne osa
        saveTable(21, 2, 72, 82, "Privaatruumid", false, true, false, false, false);
        saveTable(22, 2, 82, 82, "Privaatruumid", false, true, false, false, false);
        saveTable(23, 4, 72, 92, "Privaatruumid", false, true, false, false, false);
        saveTable(24, 4, 82, 92, "Privaatruumid", false, true, false, false, false);
    }

    private void saveTable(int number, int seats, double posX, double posY, String zone,
                           boolean window, boolean priv, boolean playground,
                           boolean accessible, boolean nearStage) {
        tableRepository.save(RestaurantTable.builder()
                .tableNumber(number).seats(seats)
                .posX(posX).posY(posY).zone(zone)
                .windowSeat(window).privateArea(priv)
                .nearPlayground(playground).accessible(accessible)
                .nearStage(nearStage).build());
    }

    private void createFloorElements() {
        //                          type          name              posX  posY  width height rotation
        // Lava ja baar
        floorElementRepository.save(new FloorElement("stage",      "\uD83C\uDFB5 LAVA",     2,   2,   15,  7,  0));
        floorElementRepository.save(new FloorElement("bar",        "BAAR",           90,  2,   8,   5,  0));
        // Köök ja mänguala
        floorElementRepository.save(new FloorElement("kitchen",    "K\u00D6KK",      2,   92,  8,   5,  0));
        floorElementRepository.save(new FloorElement("playground", "\uD83E\uDDF8",   96,  94,  4,   5,  0));

        // Aknad (window) — saali sees, seinte ääres
        floorElementRepository.save(new FloorElement("window",     "Vaade t\u00E4navale",   1,   20,  1.5,  40,  0));
        floorElementRepository.save(new FloorElement("window",     "Vaade sisehoovi",       51,  15,  1.5,  35,  0));
        floorElementRepository.save(new FloorElement("window",     "Vaade terrassile",      97,  15,  1.5,  50,  0));

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
