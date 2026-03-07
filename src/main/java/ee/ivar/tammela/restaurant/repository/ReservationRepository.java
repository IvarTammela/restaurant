package ee.ivar.tammela.restaurant.repository;

import ee.ivar.tammela.restaurant.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByDate(LocalDate date);

    @Query("SELECT r FROM Reservation r WHERE r.date = :date " +
           "AND r.startTime < :endTime AND r.endTime > :startTime")
    List<Reservation> findOverlapping(@Param("date") LocalDate date,
                                      @Param("startTime") LocalTime startTime,
                                      @Param("endTime") LocalTime endTime);
}
