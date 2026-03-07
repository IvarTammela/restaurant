package ee.ivar.tammela.restaurant.dto;

import ee.ivar.tammela.restaurant.model.RestaurantTable;
import lombok.Getter;

@Getter
public class TableRecommendation {
    private final RestaurantTable table;
    private final double score;
    private final RestaurantTable combinedWith; // null for single-table recommendations

    public TableRecommendation(RestaurantTable table, double score) {
        this(table, score, null);
    }

    public TableRecommendation(RestaurantTable table, double score, RestaurantTable combinedWith) {
        this.table = table;
        this.score = score;
        this.combinedWith = combinedWith;
    }
}
