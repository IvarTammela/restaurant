package ee.ivar.tammela.restaurant.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FloorElementDTO {
    private String type;
    private String name;
    private double posX;
    private double posY;
    private double width;
    private double height;
    private double rotation;
}
