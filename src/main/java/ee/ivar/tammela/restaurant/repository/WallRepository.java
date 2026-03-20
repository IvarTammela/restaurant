package ee.ivar.tammela.restaurant.repository;

import ee.ivar.tammela.restaurant.model.Wall;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WallRepository extends JpaRepository<Wall, Long> {
}
