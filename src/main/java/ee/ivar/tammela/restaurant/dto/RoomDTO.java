package ee.ivar.tammela.restaurant.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RoomDTO {
    private String id;
    private String name;
    private double x;
    private double y;
    private double w;
    private double h;
}
