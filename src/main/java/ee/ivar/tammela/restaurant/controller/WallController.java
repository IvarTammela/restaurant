package ee.ivar.tammela.restaurant.controller;

import ee.ivar.tammela.restaurant.dto.WallDTO;
import ee.ivar.tammela.restaurant.model.Wall;
import ee.ivar.tammela.restaurant.repository.WallRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/walls")
@RequiredArgsConstructor
public class WallController {

    private final WallRepository repository;

    @GetMapping
    public List<Wall> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<Wall> create(@RequestBody WallDTO dto) {
        Wall wall = new Wall(
                dto.getX1(), dto.getY1(),
                dto.getX2(), dto.getY2(),
                dto.getColor(), dto.getThickness());
        return ResponseEntity.ok(repository.save(wall));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAll() {
        repository.deleteAll();
        return ResponseEntity.noContent().build();
    }
}
