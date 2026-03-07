package ee.ivar.tammela.restaurant.repository;

import ee.ivar.tammela.restaurant.model.FloorElement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FloorElementRepository extends JpaRepository<FloorElement, Long> {
}
