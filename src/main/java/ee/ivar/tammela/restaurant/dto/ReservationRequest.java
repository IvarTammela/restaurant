package ee.ivar.tammela.restaurant.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class ReservationRequest {
    private Long tableId;
    private String customerName;
    private LocalDate date;
    private LocalTime startTime;
    private int partySize;
}
