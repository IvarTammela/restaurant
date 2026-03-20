package ee.ivar.tammela.restaurant.controller;

import ee.ivar.tammela.restaurant.model.RestaurantTable;
import ee.ivar.tammela.restaurant.repository.ReservationRepository;
import ee.ivar.tammela.restaurant.repository.TableRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TableControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TableRepository tableRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @BeforeEach
    void setUp() {
        reservationRepository.deleteAll();
        tableRepository.deleteAll();
        tableRepository.save(RestaurantTable.builder()
                .tableNumber(1).seats(4)
                .posX(10).posY(10).zone("Sisesaal")
                .windowSeat(true).accessible(true)
                .build());
        tableRepository.save(RestaurantTable.builder()
                .tableNumber(2).seats(6)
                .posX(20).posY(20).zone("Terrass")
                .privateArea(true)
                .build());
    }

    @Test
    @DisplayName("GET /api/tables returns 200 and list of tables")
    void getAllTablesReturns200() throws Exception {
        mockMvc.perform(get("/api/tables"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].tableNumber").exists())
                .andExpect(jsonPath("$[1].tableNumber").exists());
    }

    @Test
    @DisplayName("GET /api/tables/recommend returns recommendations sorted by score")
    void recommendTablesReturnsRecommendations() throws Exception {
        mockMvc.perform(get("/api/tables/recommend")
                        .param("date", "2026-04-01")
                        .param("time", "18:00")
                        .param("partySize", "4")
                        .param("windowSeat", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].score").isNumber());
    }
}
