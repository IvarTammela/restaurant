package ee.ivar.tammela.restaurant.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}
