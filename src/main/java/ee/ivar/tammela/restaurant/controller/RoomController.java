package ee.ivar.tammela.restaurant.controller;

import ee.ivar.tammela.restaurant.dto.RoomDTO;
import ee.ivar.tammela.restaurant.model.Room;
import ee.ivar.tammela.restaurant.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomRepository roomRepository;

    @GetMapping
    public List<RoomDTO> getRooms() {
        return roomRepository.findAll().stream()
                .map(r -> new RoomDTO(r.getId(), r.getName(), r.getX(), r.getY(), r.getWidth(), r.getHeight()))
                .toList();
    }

    @PostMapping
    public ResponseEntity<RoomDTO> createRoom(@RequestBody RoomDTO dto) {
        Room room = Room.builder()
                .name(dto.getName())
                .x(dto.getX())
                .y(dto.getY())
                .width(dto.getW())
                .height(dto.getH())
                .build();
        Room saved = roomRepository.save(room);
        return ResponseEntity.ok(new RoomDTO(saved.getId(), saved.getName(),
                saved.getX(), saved.getY(), saved.getWidth(), saved.getHeight()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        roomRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAllRooms() {
        roomRepository.deleteAll();
        return ResponseEntity.noContent().build();
    }
}
