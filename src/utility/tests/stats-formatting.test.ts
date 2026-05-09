import {formatMmrForStatsImage, formatRemainingMmrForStatsImage} from "../stats-formatting";

test("formats exact MMR values with two decimals", () => {
    expect(formatMmrForStatsImage(1450)).toBe("1450.00");
    expect(formatMmrForStatsImage(1450.4)).toBe("1450.40");
});

test("does not round MMR values up across visible rank thresholds", () => {
    expect(formatMmrForStatsImage(1449.999)).toBe("1449.99");
    expect(formatMmrForStatsImage(2049.999999)).toBe("2049.99");
});

test("does not display zero remaining MMR before a rank threshold", () => {
    expect(formatRemainingMmrForStatsImage(0.0017313900795593656)).toBe("0.01");
    expect(formatRemainingMmrForStatsImage(100.00173139007956)).toBe("100.01");
});
