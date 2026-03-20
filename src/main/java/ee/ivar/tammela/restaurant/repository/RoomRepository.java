package ee.ivar.tammela.restaurant.repository;

import ee.ivar.tammela.restaurant.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
}
