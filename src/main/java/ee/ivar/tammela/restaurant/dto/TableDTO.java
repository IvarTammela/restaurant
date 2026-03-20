package ee.ivar.tammela.restaurant.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TableDTO {
    private int tableNumber;
    private int seats;
    private double posX;
    private double posY;
    private String zone;
    private boolean windowSeat;
    private boolean privateArea;
    private boolean nearPlayground;
    private boolean accessible;
    private boolean nearStage;
}
