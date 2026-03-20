package ee.ivar.tammela.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Wall {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double x1;
    private double y1;
    private double x2;
    private double y2;

    private String color;
    private double thickness;

    public Wall(double x1, double y1, double x2, double y2, String color, double thickness) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.color = color;
        this.thickness = thickness;
    }
}
