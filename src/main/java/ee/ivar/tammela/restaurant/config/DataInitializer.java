package ee.ivar.tammela.restaurant.config;

import ee.ivar.tammela.restaurant.model.Reservation;
import ee.ivar.tammela.restaurant.model.RestaurantTable;
import ee.ivar.tammela.restaurant.model.Zone;
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

    @Override
    public void run(String... args) {
        createTables();
        createRandomReservations();
    }

    private void createTables() {
        // Main hall - 10 tables along the walls and center
        // Left wall (window seats)
        tableRepository.save(new RestaurantTable(1, 2, 5, 15, Zone.MAIN_HALL, true, false, false, true));
        tableRepository.save(new RestaurantTable(2, 2, 5, 30, Zone.MAIN_HALL, true, false, false, false));
        tableRepository.save(new RestaurantTable(3, 4, 5, 45, Zone.MAIN_HALL, true, false, false, false));
        tableRepository.save(new RestaurantTable(4, 4, 5, 60, Zone.MAIN_HALL, true, false, true, false));
        // Center tables
        tableRepository.save(new RestaurantTable(5, 6, 25, 20, Zone.MAIN_HALL, false, false, false, true));
        tableRepository.save(new RestaurantTable(6, 6, 25, 40, Zone.MAIN_HALL, false, false, false, true));
        tableRepository.save(new RestaurantTable(7, 4, 25, 60, Zone.MAIN_HALL, false, false, true, true));
        // Right wall
        RestaurantTable t8 = new RestaurantTable(8, 2, 45, 15, Zone.MAIN_HALL, true, false, false, false);
        t8.setNearStage(true);
        tableRepository.save(t8);
        tableRepository.save(new RestaurantTable(9, 4, 45, 35, Zone.MAIN_HALL, true, false, false, false));
        RestaurantTable t10 = new RestaurantTable(10, 8, 45, 55, Zone.MAIN_HALL, false, false, true, true);
        t10.setNearStage(true);
        tableRepository.save(t10);

        // Terrace - 6 tables
        tableRepository.save(new RestaurantTable(11, 2, 65, 10, Zone.TERRACE, false, false, false, false));
        tableRepository.save(new RestaurantTable(12, 4, 65, 28, Zone.TERRACE, false, false, false, true));
        tableRepository.save(new RestaurantTable(13, 4, 65, 46, Zone.TERRACE, false, false, false, false));
        tableRepository.save(new RestaurantTable(14, 6, 85, 10, Zone.TERRACE, false, false, false, false));
        tableRepository.save(new RestaurantTable(15, 6, 85, 28, Zone.TERRACE, false, false, false, true));
        tableRepository.save(new RestaurantTable(16, 2, 85, 46, Zone.TERRACE, false, false, false, false));

        // Private rooms - 8 tables
        tableRepository.save(new RestaurantTable(17, 4, 10, 78, Zone.PRIVATE_ROOM, false, true, false, false));
        tableRepository.save(new RestaurantTable(18, 6, 28, 78, Zone.PRIVATE_ROOM, false, true, false, false));
        tableRepository.save(new RestaurantTable(19, 8, 10, 92, Zone.PRIVATE_ROOM, true, true, false, true));
        tableRepository.save(new RestaurantTable(20, 10, 28, 92, Zone.PRIVATE_ROOM, false, true, false, true));
        tableRepository.save(new RestaurantTable(21, 2, 43, 76, Zone.PRIVATE_ROOM, false, true, false, false));
        tableRepository.save(new RestaurantTable(22, 2, 53, 76, Zone.PRIVATE_ROOM, false, true, false, false));
        tableRepository.save(new RestaurantTable(23, 4, 43, 89, Zone.PRIVATE_ROOM, false, true, false, false));
        tableRepository.save(new RestaurantTable(24, 4, 53, 89, Zone.PRIVATE_ROOM, false, true, false, false));
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
