package ee.ivar.tammela.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int tableNumber;
    private int seats;

    // Position on floor plan (percentage-based, 0-100)
    private double posX;
    private double posY;

    @Enumerated(EnumType.STRING)
    private Zone zone;

    private boolean windowSeat;
    private boolean privateArea;
    private boolean nearPlayground;
    private boolean accessible;
    private boolean nearStage;

    public RestaurantTable(int tableNumber, int seats, double posX, double posY,
                           Zone zone, boolean windowSeat, boolean privateArea,
                           boolean nearPlayground, boolean accessible) {
        this.tableNumber = tableNumber;
        this.seats = seats;
        this.posX = posX;
        this.posY = posY;
        this.zone = zone;
        this.windowSeat = windowSeat;
        this.privateArea = privateArea;
        this.nearPlayground = nearPlayground;
        this.accessible = accessible;
        this.nearStage = false;
    }
}
