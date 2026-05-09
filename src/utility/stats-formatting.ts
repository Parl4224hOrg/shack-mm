export function formatMmrForStatsImage(value: number): string {
    const truncated = Math.trunc(value * 100) / 100;
    return truncated.toFixed(2);
}
