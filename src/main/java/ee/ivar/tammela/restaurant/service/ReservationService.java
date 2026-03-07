package ee.ivar.tammela.restaurant.service;

import ee.ivar.tammela.restaurant.dto.TableRecommendation;
import ee.ivar.tammela.restaurant.model.Reservation;
import ee.ivar.tammela.restaurant.model.RestaurantTable;
import ee.ivar.tammela.restaurant.model.Zone;
import ee.ivar.tammela.restaurant.repository.ReservationRepository;
import ee.ivar.tammela.restaurant.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final TableRepository tableRepository;
    private final RecommendationService recommendationService;

    private static final int DEFAULT_DURATION_HOURS = 2;

    public List<RestaurantTable> findAvailableTables(LocalDate date, LocalTime startTime,
                                                     LocalTime endTime, Zone zone) {
        List<Reservation> overlapping = reservationRepository.findOverlapping(date, startTime, endTime);
        Set<Long> occupiedTableIds = overlapping.stream()
                .map(r -> r.getTable().getId())
                .collect(Collectors.toSet());

        List<RestaurantTable> allTables = (zone != null)
                ? tableRepository.findByZone(zone)
                : tableRepository.findAll();

        return allTables.stream()
                .filter(t -> !occupiedTableIds.contains(t.getId()))
                .toList();
    }

    public List<TableRecommendation> recommendTables(LocalDate date, LocalTime startTime,
                                                      LocalTime endTime, int partySize,
                                                      Zone zone,
                                                      boolean prefWindow, boolean prefPrivate,
                                                      boolean prefPlayground, boolean prefAccessible,
                                                      boolean prefStage) {
        List<RestaurantTable> available = findAvailableTables(date, startTime, endTime, zone);
        return recommendationService.recommend(available, partySize,
                prefWindow, prefPrivate, prefPlayground, prefAccessible, prefStage);
    }

    public Reservation createReservation(Long tableId, String customerName,
                                          LocalDate date, LocalTime startTime,
                                          int partySize) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));

        LocalTime endTime = startTime.plusHours(DEFAULT_DURATION_HOURS);

        // Check if table is available
        List<Reservation> overlapping = reservationRepository.findOverlapping(date, startTime, endTime);
        boolean tableOccupied = overlapping.stream()
                .anyMatch(r -> r.getTable().getId().equals(tableId));
        if (tableOccupied) {
            throw new IllegalStateException("Table is already reserved for this time slot");
        }

        Reservation reservation = new Reservation(table, customerName, date, startTime, endTime, partySize);
        return reservationRepository.save(reservation);
    }

    public List<Reservation> getReservationsByDate(LocalDate date) {
        return reservationRepository.findByDate(date);
    }
}
