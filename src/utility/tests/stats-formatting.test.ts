import {formatMmrForStatsImage} from "../stats-formatting";

test("formats exact MMR values with two decimals", () => {
    expect(formatMmrForStatsImage(1450)).toBe("1450.00");
    expect(formatMmrForStatsImage(1450.4)).toBe("1450.40");
});

test("does not round MMR values up across visible rank thresholds", () => {
    expect(formatMmrForStatsImage(1449.999)).toBe("1449.99");
    expect(formatMmrForStatsImage(2049.999999)).toBe("2049.99");
});
