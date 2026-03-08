package ee.ivar.tammela.restaurant.dto;

import ee.ivar.tammela.restaurant.model.Zone;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TableDTO {
    private int tableNumber;
    private int seats;
    private double posX;
    private double posY;
    private Zone zone;
    private boolean windowSeat;
    private boolean privateArea;
    private boolean nearPlayground;
    private boolean accessible;
    private boolean nearStage;
}
