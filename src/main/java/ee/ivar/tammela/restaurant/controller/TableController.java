package ee.ivar.tammela.restaurant.controller;

import ee.ivar.tammela.restaurant.dto.TableRecommendation;
import ee.ivar.tammela.restaurant.model.RestaurantTable;
import ee.ivar.tammela.restaurant.model.Zone;
import ee.ivar.tammela.restaurant.repository.TableRepository;
import ee.ivar.tammela.restaurant.service.RecommendationService;
import ee.ivar.tammela.restaurant.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableRepository tableRepository;
    private final ReservationService reservationService;
    private final RecommendationService recommendationService;

    private static final int DEFAULT_DURATION_HOURS = 2;

    @GetMapping
    public List<RestaurantTable> getAllTables() {
        return tableRepository.findAll();
    }

    @GetMapping("/available")
    public List<RestaurantTable> getAvailableTables(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime time,
            @RequestParam(defaultValue = "1") int partySize,
            @RequestParam(required = false) Zone zone,
            @RequestParam(defaultValue = "false") boolean windowSeat,
            @RequestParam(defaultValue = "false") boolean privateArea,
            @RequestParam(defaultValue = "false") boolean nearPlayground,
            @RequestParam(defaultValue = "false") boolean accessible) {

        LocalTime endTime = time.plusHours(DEFAULT_DURATION_HOURS);
        List<RestaurantTable> available = reservationService.findAvailableTables(date, time, endTime, zone);

        return available.stream()
                .filter(t -> t.getSeats() >= partySize)
                .toList();
    }

    @GetMapping("/recommend")
    public ResponseEntity<List<TableRecommendation>> recommendTables(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime time,
            @RequestParam(defaultValue = "1") int partySize,
            @RequestParam(required = false) Zone zone,
            @RequestParam(defaultValue = "false") boolean windowSeat,
            @RequestParam(defaultValue = "false") boolean privateArea,
            @RequestParam(defaultValue = "false") boolean nearPlayground,
            @RequestParam(defaultValue = "false") boolean accessible) {

        LocalTime endTime = time.plusHours(DEFAULT_DURATION_HOURS);
        List<RestaurantTable> recommended = reservationService.recommendTables(
                date, time, endTime, partySize, zone,
                windowSeat, privateArea, nearPlayground, accessible);

        List<TableRecommendation> result = recommended.stream()
                .map(t -> new TableRecommendation(t,
                        recommendationService.scoreTable(t, partySize,
                                windowSeat, privateArea, nearPlayground, accessible)))
                .toList();

        return ResponseEntity.ok(result);
    }
}
