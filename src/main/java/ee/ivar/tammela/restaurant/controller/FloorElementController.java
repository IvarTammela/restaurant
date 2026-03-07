package ee.ivar.tammela.restaurant.controller;

import ee.ivar.tammela.restaurant.model.FloorElement;
import ee.ivar.tammela.restaurant.repository.FloorElementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/elements")
@RequiredArgsConstructor
public class FloorElementController {

    private final FloorElementRepository repository;

    @GetMapping
    public List<FloorElement> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<FloorElement> create(@RequestBody FloorElement element) {
        element.setId(null);
        return ResponseEntity.ok(repository.save(element));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FloorElement> update(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        FloorElement elem = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Element not found"));
        if (updates.containsKey("name")) elem.setName((String) updates.get("name"));
        if (updates.containsKey("posX")) elem.setPosX(((Number) updates.get("posX")).doubleValue());
        if (updates.containsKey("posY")) elem.setPosY(((Number) updates.get("posY")).doubleValue());
        if (updates.containsKey("width")) elem.setWidth(((Number) updates.get("width")).doubleValue());
        if (updates.containsKey("height")) elem.setHeight(((Number) updates.get("height")).doubleValue());
        if (updates.containsKey("rotation")) elem.setRotation(((Number) updates.get("rotation")).doubleValue());
        return ResponseEntity.ok(repository.save(elem));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
