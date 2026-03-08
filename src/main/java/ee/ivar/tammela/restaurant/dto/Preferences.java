package ee.ivar.tammela.restaurant.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class Preferences {
    private final boolean windowSeat;
    private final boolean privateArea;
    private final boolean nearPlayground;
    private final boolean accessible;
    private final boolean nearStage;
}
