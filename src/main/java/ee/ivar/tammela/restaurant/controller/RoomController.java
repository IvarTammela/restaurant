package ee.ivar.tammela.restaurant.controller;

import ee.ivar.tammela.restaurant.dto.RoomDTO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    @GetMapping
    public List<RoomDTO> getRooms() {
        return List.of(
                new RoomDTO("MAIN_HALL", "Sisesaal", 0, 0, 52, 72),
                new RoomDTO("TERRACE", "Terrass", 54, 0, 46, 72),
                new RoomDTO("PRIVATE_ROOM", "Privaatruumid", 0, 74, 100, 26)
        );
    }
}
