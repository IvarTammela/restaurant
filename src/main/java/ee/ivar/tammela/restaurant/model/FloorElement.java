package ee.ivar.tammela.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class FloorElement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;      // bar, kitchen, stage, door, window, playground
    private String name;      // display label

    private double posX;      // percentage 0-100
    private double posY;

    private double width;     // percentage 0-100
    private double height;

    private double rotation;  // degrees 0-360

    public FloorElement(String type, String name, double posX, double posY,
                         double width, double height, double rotation) {
        this.type = type;
        this.name = name;
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
        this.rotation = rotation;
    }
}
