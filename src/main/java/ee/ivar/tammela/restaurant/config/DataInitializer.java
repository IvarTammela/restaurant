package ee.ivar.tammela.restaurant.config;

import ee.ivar.tammela.restaurant.model.FloorElement;
import ee.ivar.tammela.restaurant.model.Reservation;
import ee.ivar.tammela.restaurant.model.RestaurantTable;
import ee.ivar.tammela.restaurant.model.Zone;
import ee.ivar.tammela.restaurant.repository.FloorElementRepository;
import ee.ivar.tammela.restaurant.repository.ReservationRepository;
import ee.ivar.tammela.restaurant.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TableRepository tableRepository;
    private final ReservationRepository reservationRepository;
    private final FloorElementRepository floorElementRepository;

    @Override
    public void run(String... args) {
        createTables();
        createFloorElements();
        createRandomReservations();
    }

    private void createTables() {
        // Sisesaal - vasakpoolne sein (akna ääres)
        tableRepository.save(new RestaurantTable(1, 2, 5, 25, Zone.MAIN_HALL, true, false, false, true));
        tableRepository.save(new RestaurantTable(2, 2, 5, 40, Zone.MAIN_HALL, true, false, false, false));
        tableRepository.save(new RestaurantTable(3, 4, 5, 55, Zone.MAIN_HALL, true, false, false, false));
        tableRepository.save(new RestaurantTable(4, 2, 18, 60, Zone.MAIN_HALL, false, false, true, false));
        // Sisesaal - keskel
        tableRepository.save(new RestaurantTable(5, 6, 22, 25, Zone.MAIN_HALL, false, false, false, true));
        tableRepository.save(new RestaurantTable(6, 6, 22, 45, Zone.MAIN_HALL, false, false, false, true));
        tableRepository.save(new RestaurantTable(7, 4, 35, 60, Zone.MAIN_HALL, false, false, true, true));
        // Sisesaal - parempoolne sein (akna ääres, lava lähedal)
        RestaurantTable t8 = new RestaurantTable(8, 2, 42, 20, Zone.MAIN_HALL, true, false, false, false);
        t8.setNearStage(true);
        tableRepository.save(t8);
        tableRepository.save(new RestaurantTable(9, 4, 42, 38, Zone.MAIN_HALL, true, false, false, false));
        RestaurantTable t10 = new RestaurantTable(10, 8, 42, 58, Zone.MAIN_HALL, false, false, true, true);
        t10.setNearStage(true);
        tableRepository.save(t10);

        // Terrass - vasakpoolne rida
        tableRepository.save(new RestaurantTable(11, 2, 62, 15, Zone.TERRACE, false, false, false, false));
        tableRepository.save(new RestaurantTable(12, 4, 62, 35, Zone.TERRACE, false, false, false, true));
        tableRepository.save(new RestaurantTable(13, 4, 62, 55, Zone.TERRACE, false, false, false, false));
        // Terrass - parempoolne rida
        tableRepository.save(new RestaurantTable(14, 6, 82, 20, Zone.TERRACE, false, false, false, false));
        tableRepository.save(new RestaurantTable(15, 6, 82, 40, Zone.TERRACE, false, false, false, true));
        tableRepository.save(new RestaurantTable(16, 2, 82, 58, Zone.TERRACE, false, false, false, false));

        // Privaatruumid - ülemine rida
        tableRepository.save(new RestaurantTable(17, 4, 10, 85, Zone.PRIVATE_ROOM, false, true, false, false));
        tableRepository.save(new RestaurantTable(18, 6, 25, 85, Zone.PRIVATE_ROOM, false, true, false, false));
        tableRepository.save(new RestaurantTable(19, 8, 42, 85, Zone.PRIVATE_ROOM, false, true, false, true));
        tableRepository.save(new RestaurantTable(20, 10, 58, 85, Zone.PRIVATE_ROOM, false, true, false, true));
        // Privaatruumid - parempoolne osa
        tableRepository.save(new RestaurantTable(21, 2, 72, 82, Zone.PRIVATE_ROOM, false, true, false, false));
        tableRepository.save(new RestaurantTable(22, 2, 82, 82, Zone.PRIVATE_ROOM, false, true, false, false));
        tableRepository.save(new RestaurantTable(23, 4, 72, 92, Zone.PRIVATE_ROOM, false, true, false, false));
        tableRepository.save(new RestaurantTable(24, 4, 82, 92, Zone.PRIVATE_ROOM, false, true, false, false));
    }

    private void createFloorElements() {
        //                          type          name           posX  posY  width height rotation
        floorElementRepository.save(new FloorElement("stage",      "\uD83C\uDFB5 LAVA",  2,   2,   15,  7,  0));
        floorElementRepository.save(new FloorElement("bar",        "BAAR",        90,  2,   8,   5,  0));
        floorElementRepository.save(new FloorElement("kitchen",    "K\u00D6KK",   2,   92,  8,   5,  0));
        floorElementRepository.save(new FloorElement("playground", "\uD83E\uDDF8", 96, 94,  4,   5,  0));
        floorElementRepository.save(new FloorElement("door",       "\u2191",       49,  97,  3,   3,  0));
    }

    private void createRandomReservations() {
        List<RestaurantTable> tables = tableRepository.findAll();
        Random random = new Random(42);
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
