package ee.ivar.tammela.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "table_id", nullable = false)
    private RestaurantTable table;

    private String customerName;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private int partySize;

    public Reservation(RestaurantTable table, String customerName,
                       LocalDate date, LocalTime startTime, LocalTime endTime,
                       int partySize) {
        this.table = table;
        this.customerName = customerName;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.partySize = partySize;
    }
}
