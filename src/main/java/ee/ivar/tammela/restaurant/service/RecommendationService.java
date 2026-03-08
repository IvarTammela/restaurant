package ee.ivar.tammela.restaurant.service;

import ee.ivar.tammela.restaurant.dto.Preferences;
import ee.ivar.tammela.restaurant.dto.TableRecommendation;
import ee.ivar.tammela.restaurant.model.RestaurantTable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class RecommendationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);

    private static final int MAX_SINGLE_TABLE_SEATS = 10;
    // Two tables are considered adjacent if Euclidean distance < 35 (percentage units)
    private static final double ADJACENCY_THRESHOLD = 35.0;

    /**
     * Scores a table based on party size fit and preference matches.
     * Higher score = better match.
     */
    public double scoreTable(RestaurantTable table, int partySize, Preferences prefs) {
        if (table.getSeats() < partySize) return -100;

        int extraSeats = table.getSeats() - partySize;
        double score = Math.max(0, 50 - extraSeats * 8);

        if (prefs.isWindowSeat() && table.isWindowSeat()) score += 10;
        if (prefs.isPrivateArea() && table.isPrivateArea()) score += 10;
        if (prefs.isNearPlayground() && table.isNearPlayground()) score += 10;
        if (prefs.isAccessible() && table.isAccessible()) score += 10;
        if (prefs.isNearStage() && table.isNearStage()) score += 10;
        if (table.isAccessible()) score += 2;

        return score;
    }

    /**
     * Returns recommendations sorted by score (best first).
     * For partySize > MAX_SINGLE_TABLE_SEATS, finds adjacent table pairs.
     */
    public List<TableRecommendation> recommend(List<RestaurantTable> availableTables,
                                               int partySize, Preferences prefs) {
        if (partySize > MAX_SINGLE_TABLE_SEATS) {
            return findCombinedRecommendations(availableTables, partySize, prefs);
        }

        return availableTables.stream()
                .filter(t -> t.getSeats() >= partySize)
                .sorted(Comparator.comparingDouble(
                        (RestaurantTable t) -> scoreTable(t, partySize, prefs))
                        .reversed())
                .map(t -> new TableRecommendation(t, scoreTable(t, partySize, prefs)))
                .toList();
    }

    private List<TableRecommendation> findCombinedRecommendations(List<RestaurantTable> available,
                                                                    int partySize, Preferences prefs) {
        log.info("Looking for combinations, partySize={}, available tables={}, threshold={}",
                partySize, available.size(), ADJACENCY_THRESHOLD);

        List<TableRecommendation> results = new ArrayList<>();

        for (int i = 0; i < available.size(); i++) {
            for (int j = i + 1; j < available.size(); j++) {
                RestaurantTable t1 = available.get(i);
                RestaurantTable t2 = available.get(j);

                double dist = distance(t1, t2);
                boolean eligible = t1.getSeats() + t2.getSeats() >= partySize && dist < ADJACENCY_THRESHOLD;

                log.debug("  Pair ({}+{} seats): tables #{} + #{}, dist={:.1f}",
                        t1.getSeats(), t2.getSeats(), t1.getTableNumber(), t2.getTableNumber(), dist);

                if (!eligible) continue;

                double score = scoreCombined(t1, t2, partySize, prefs);
                results.add(new TableRecommendation(t1, score, t2));
            }
        }

        results.sort(Comparator.comparingDouble(TableRecommendation::getScore).reversed());
        return results;
    }

    private double distance(RestaurantTable t1, RestaurantTable t2) {
        double dx = t1.getPosX() - t2.getPosX();
        double dy = t1.getPosY() - t2.getPosY();
        return Math.sqrt(dx * dx + dy * dy);
    }

    private double scoreCombined(RestaurantTable t1, RestaurantTable t2,
                                  int partySize, Preferences prefs) {
        int combinedSeats = t1.getSeats() + t2.getSeats();
        int extraSeats = combinedSeats - partySize;
        double score = Math.max(0, 50 - extraSeats * 5);

        // Average preference score of both tables
        double prefScore1 = prefScore(t1, prefs);
        double prefScore2 = prefScore(t2, prefs);
        score += (prefScore1 + prefScore2) / 2.0;

        return score;
    }

    private double prefScore(RestaurantTable t, Preferences prefs) {
        double score = 0;
        if (prefs.isWindowSeat() && t.isWindowSeat()) score += 10;
        if (prefs.isPrivateArea() && t.isPrivateArea()) score += 10;
        if (prefs.isNearPlayground() && t.isNearPlayground()) score += 10;
        if (prefs.isAccessible() && t.isAccessible()) score += 10;
        if (prefs.isNearStage() && t.isNearStage()) score += 10;
        return score;
    }
}
