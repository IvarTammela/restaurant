package ee.ivar.tammela.restaurant.service;

import ee.ivar.tammela.restaurant.model.RestaurantTable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class RecommendationService {

    /**
     * Scores a table based on party size fit and preference matches.
     * Higher score = better match.
     */
    public double scoreTable(RestaurantTable table, int partySize,
                             boolean prefWindow, boolean prefPrivate,
                             boolean prefPlayground, boolean prefAccessible) {
        double score = 0;

        // Size fit scoring (max 50 points)
        // Perfect fit = 50, each extra seat loses 5 points, too small = -100
        if (table.getSeats() < partySize) {
            return -100; // Table too small
        }
        int extraSeats = table.getSeats() - partySize;
        score += Math.max(0, 50 - extraSeats * 8);

        // Preference scoring (max 10 points each, 40 total)
        if (prefWindow && table.isWindowSeat()) score += 10;
        if (prefPrivate && table.isPrivateArea()) score += 10;
        if (prefPlayground && table.isNearPlayground()) score += 10;
        if (prefAccessible && table.isAccessible()) score += 10;

        // Small bonus for accessible tables (universal design)
        if (table.isAccessible()) score += 2;

        return score;
    }

    /**
     * Returns tables sorted by recommendation score (best first).
     */
    public List<RestaurantTable> recommend(List<RestaurantTable> availableTables,
                                           int partySize,
                                           boolean prefWindow, boolean prefPrivate,
                                           boolean prefPlayground, boolean prefAccessible) {
        return availableTables.stream()
                .filter(t -> t.getSeats() >= partySize)
                .sorted(Comparator.comparingDouble(
                        (RestaurantTable t) -> scoreTable(t, partySize,
                                prefWindow, prefPrivate, prefPlayground, prefAccessible))
                        .reversed())
                .toList();
    }
}
