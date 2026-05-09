export function formatMmrForStatsImage(value: number): string {
    const truncated = Math.trunc(value * 100) / 100;
    return truncated.toFixed(2);
}

export function formatRemainingMmrForStatsImage(value: number): string {
    const ceiled = Math.ceil((value - Number.EPSILON) * 100) / 100;
    return ceiled.toFixed(2);
}
