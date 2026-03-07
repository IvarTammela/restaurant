package ee.ivar.tammela.restaurant.dto;

import ee.ivar.tammela.restaurant.model.RestaurantTable;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TableRecommendation {
    private RestaurantTable table;
    private double score;
}
