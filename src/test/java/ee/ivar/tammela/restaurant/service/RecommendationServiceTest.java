package ee.ivar.tammela.restaurant.service;

import ee.ivar.tammela.restaurant.dto.Preferences;
import ee.ivar.tammela.restaurant.dto.TableRecommendation;
import ee.ivar.tammela.restaurant.model.RestaurantTable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RecommendationServiceTest {

    private RecommendationService service;
    private Preferences noPrefs;

    @BeforeEach
    void setUp() {
        service = new RecommendationService();
        noPrefs = new Preferences(false, false, false, false, false);
    }

    @Nested
    @DisplayName("scoreTable")
    class ScoreTableTests {

        @Test
        @DisplayName("perfect size match gives score of 50")
        void perfectSizeMatch() {
            RestaurantTable table = RestaurantTable.builder()
                    .id(1L).tableNumber(1).seats(2)
                    .posX(10).posY(10).zone("Sisesaal")
                    .build();

            double score = service.scoreTable(table, 2, noPrefs);

            assertThat(score).isEqualTo(50.0);
        }

        @Test
        @DisplayName("extra seats apply penalty of 8 per extra seat")
        void extraSeatsPenalty() {
            RestaurantTable table = RestaurantTable.builder()
                    .id(2L).tableNumber(2).seats(6)
                    .posX(10).posY(10).zone("Sisesaal")
                    .build();

            double score = service.scoreTable(table, 2, noPrefs);

            // 50 - 4*8 = 18
            assertThat(score).isEqualTo(18.0);
        }

        @Test
        @DisplayName("table too small returns -100")
        void tableTooSmall() {
            RestaurantTable table = RestaurantTable.builder()
                    .id(3L).tableNumber(3).seats(2)
                    .posX(10).posY(10).zone("Sisesaal")
                    .build();

            double score = service.scoreTable(table, 3, noPrefs);

            assertThat(score).isEqualTo(-100.0);
        }

        @Test
        @DisplayName("window and private preferences add +20 bonus")
        void preferenceBonus() {
            RestaurantTable table = RestaurantTable.builder()
                    .id(4L).tableNumber(4).seats(2)
                    .posX(10).posY(10).zone("Sisesaal")
                    .windowSeat(true).privateArea(true)
                    .build();
            Preferences prefs = new Preferences(true, true, false, false, false);

            double score = service.scoreTable(table, 2, prefs);

            // 50 (perfect fit) + 10 (window) + 10 (private) = 70
            assertThat(score).isEqualTo(70.0);
        }

        @Test
        @DisplayName("accessible table always adds +2 regardless of preference")
        void accessibilityAlwaysAdds() {
            RestaurantTable table = RestaurantTable.builder()
                    .id(5L).tableNumber(5).seats(2)
                    .posX(10).posY(10).zone("Sisesaal")
                    .accessible(true)
                    .build();

            double score = service.scoreTable(table, 2, noPrefs);

            // 50 + 2 (accessible always) = 52
            assertThat(score).isEqualTo(52.0);
        }
    }

    @Nested
    @DisplayName("recommend")
    class RecommendTests {

        @Test
        @DisplayName("returns tables sorted by score, best first")
        void sortedByScore() {
            RestaurantTable perfect = RestaurantTable.builder()
                    .id(1L).tableNumber(1).seats(4)
                    .posX(10).posY(10).zone("Sisesaal")
                    .build();
            RestaurantTable oversized = RestaurantTable.builder()
                    .id(2L).tableNumber(2).seats(8)
                    .posX(20).posY(20).zone("Sisesaal")
                    .build();

            List<TableRecommendation> result = service.recommend(
                    List.of(oversized, perfect), 4, noPrefs);

            assertThat(result).hasSize(2);
            assertThat(result.get(0).getTable().getId()).isEqualTo(1L);
            assertThat(result.get(0).getScore()).isGreaterThan(result.get(1).getScore());
        }

        @Test
        @DisplayName("filters out tables smaller than party size")
        void filtersSmallTables() {
            RestaurantTable small = RestaurantTable.builder()
                    .id(1L).tableNumber(1).seats(2)
                    .posX(10).posY(10).zone("Sisesaal")
                    .build();
            RestaurantTable big = RestaurantTable.builder()
                    .id(2L).tableNumber(2).seats(6)
                    .posX(20).posY(20).zone("Sisesaal")
                    .build();

            List<TableRecommendation> result = service.recommend(
                    List.of(small, big), 4, noPrefs);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTable().getId()).isEqualTo(2L);
        }

        @Test
        @DisplayName("returns empty list when no tables fit")
        void emptyWhenNoFit() {
            RestaurantTable small = RestaurantTable.builder()
                    .id(1L).tableNumber(1).seats(2)
                    .posX(10).posY(10).zone("Sisesaal")
                    .build();

            List<TableRecommendation> result = service.recommend(
                    List.of(small), 6, noPrefs);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findCombinedRecommendations (partySize > 10)")
    class CombinedRecommendationTests {

        @Test
        @DisplayName("two adjacent tables are combined when party size > 10")
        void adjacentTablesCombined() {
            RestaurantTable t1 = RestaurantTable.builder()
                    .id(1L).tableNumber(1).seats(8)
                    .posX(10).posY(10).zone("Sisesaal")
                    .build();
            RestaurantTable t2 = RestaurantTable.builder()
                    .id(2L).tableNumber(2).seats(8)
                    .posX(20).posY(10).zone("Sisesaal")
                    .build();

            // distance = 10, well under threshold of 35
            List<TableRecommendation> result = service.recommend(
                    List.of(t1, t2), 12, noPrefs);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTable()).isNotNull();
            assertThat(result.get(0).getCombinedWith()).isNotNull();
            int totalSeats = result.get(0).getTable().getSeats()
                    + result.get(0).getCombinedWith().getSeats();
            assertThat(totalSeats).isGreaterThanOrEqualTo(12);
        }

        @Test
        @DisplayName("tables too far apart are not combined")
        void tooFarApartNotCombined() {
            RestaurantTable t1 = RestaurantTable.builder()
                    .id(1L).tableNumber(1).seats(8)
                    .posX(0).posY(0).zone("Sisesaal")
                    .build();
            RestaurantTable t2 = RestaurantTable.builder()
                    .id(2L).tableNumber(2).seats(8)
                    .posX(50).posY(50).zone("Sisesaal")
                    .build();

            // distance = sqrt(2500+2500) ~ 70.7, above threshold of 35
            List<TableRecommendation> result = service.recommend(
                    List.of(t1, t2), 12, noPrefs);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("each table appears in at most one combination")
        void deduplication() {
            RestaurantTable t1 = RestaurantTable.builder()
                    .id(1L).tableNumber(1).seats(6)
                    .posX(10).posY(10).zone("Sisesaal")
                    .build();
            RestaurantTable t2 = RestaurantTable.builder()
                    .id(2L).tableNumber(2).seats(6)
                    .posX(15).posY(10).zone("Sisesaal")
                    .build();
            RestaurantTable t3 = RestaurantTable.builder()
                    .id(3L).tableNumber(3).seats(6)
                    .posX(20).posY(10).zone("Sisesaal")
                    .build();

            // All three are close; three possible pairs, but dedup should limit usage
            List<TableRecommendation> result = service.recommend(
                    List.of(t1, t2, t3), 11, noPrefs);

            // Collect all table IDs used in combinations
            java.util.Set<Long> usedIds = new java.util.HashSet<>();
            for (TableRecommendation rec : result) {
                long id1 = rec.getTable().getId();
                long id2 = rec.getCombinedWith().getId();
                assertThat(usedIds).doesNotContain(id1);
                assertThat(usedIds).doesNotContain(id2);
                usedIds.add(id1);
                usedIds.add(id2);
            }
        }
    }
}
