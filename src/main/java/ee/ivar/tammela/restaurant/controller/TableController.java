package ee.ivar.tammela.restaurant.controller;

import ee.ivar.tammela.restaurant.dto.TableRecommendation;
import ee.ivar.tammela.restaurant.model.RestaurantTable;
import ee.ivar.tammela.restaurant.model.Zone;
import ee.ivar.tammela.restaurant.repository.ReservationRepository;
import ee.ivar.tammela.restaurant.repository.TableRepository;
import ee.ivar.tammela.restaurant.service.ReservationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableRepository tableRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationService reservationService;

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
            @RequestParam(defaultValue = "false") boolean accessible,
            @RequestParam(defaultValue = "false") boolean nearStage) {

        LocalTime endTime = time.plusHours(DEFAULT_DURATION_HOURS);
        List<TableRecommendation> result = reservationService.recommendTables(
                date, time, endTime, partySize, zone,
                windowSeat, privateArea, nearPlayground, accessible, nearStage);

        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/position")
    public ResponseEntity<RestaurantTable> updatePosition(
            @PathVariable Long id,
            @RequestBody Map<String, Double> position) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));
        table.setPosX(position.get("posX"));
        table.setPosY(position.get("posY"));
        return ResponseEntity.ok(tableRepository.save(table));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RestaurantTable> updateTable(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));
        if (updates.containsKey("seats")) table.setSeats((Integer) updates.get("seats"));
        if (updates.containsKey("zone")) table.setZone(Zone.valueOf((String) updates.get("zone")));
        if (updates.containsKey("tableNumber")) table.setTableNumber((Integer) updates.get("tableNumber"));
        if (updates.containsKey("windowSeat")) table.setWindowSeat((Boolean) updates.get("windowSeat"));
        if (updates.containsKey("privateArea")) table.setPrivateArea((Boolean) updates.get("privateArea"));
        if (updates.containsKey("nearPlayground")) table.setNearPlayground((Boolean) updates.get("nearPlayground"));
        if (updates.containsKey("accessible")) table.setAccessible((Boolean) updates.get("accessible"));
        if (updates.containsKey("nearStage")) table.setNearStage((Boolean) updates.get("nearStage"));
        return ResponseEntity.ok(tableRepository.save(table));
    }

    @PostMapping
    public ResponseEntity<RestaurantTable> createTable(@RequestBody RestaurantTable table) {
        table.setId(null);
        return ResponseEntity.ok(tableRepository.save(table));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteTable(@PathVariable Long id) {
        reservationRepository.deleteByTableId(id);
        tableRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
