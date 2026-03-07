package ee.ivar.tammela.restaurant.repository;

import ee.ivar.tammela.restaurant.model.RestaurantTable;
import ee.ivar.tammela.restaurant.model.Zone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TableRepository extends JpaRepository<RestaurantTable, Long> {
    List<RestaurantTable> findByZone(Zone zone);
    List<RestaurantTable> findBySeatsGreaterThanEqual(int seats);
}
