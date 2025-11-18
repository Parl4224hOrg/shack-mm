import path from "path";
import fs from "fs";
import {StatsInt} from "../database/models/StatsModel";

// We use Puppeteer to render the existing widget HTML/CSS server-side and return a PNG Buffer
import puppeteer from "puppeteer";

// Rank tiers (ported from content-script)
const RANK_TIERS: { name: string; slug: string; min: number; max: number; range: string }[] = [
    {name: "Wood", slug: "wood", min: -Infinity, max: 1299, range: "≤1299"},
    {name: "Copper", slug: "copper", min: 1300, max: 1374, range: "1300-1374"},
    {name: "Iron", slug: "iron", min: 1375, max: 1469, range: "1375-1469"},
    {name: "Bronze", slug: "bronze", min: 1470, max: 1550, range: "1470-1550"},
    {name: "Silver", slug: "silver", min: 1551, max: 1610, range: "1551-1610"},
    {name: "Gold", slug: "gold", min: 1611, max: 1700, range: "1611-1700"},
    {name: "Platinum", slug: "platinum", min: 1701, max: 1820, range: "1701-1820"},
    {name: "Diamond", slug: "diamond", min: 1821, max: 1949, range: "1821-1949"},
    {name: "Master", slug: "master", min: 1950, max: 2299, range: "1950-2299"},
    {name: "Grandmaster", slug: "grandmaster", min: 2300, max: Infinity, range: "2300+"}
];

const formatInteger = (value: number | null | undefined) =>
    value == null || Number.isNaN(value) ? "?" : new Intl.NumberFormat("en-US").format(Math.round(value));

const formatPercent = (value: number | null | undefined) =>
    value == null || Number.isNaN(value) ? "?" : `${Math.round((value as number) * 100)}%`;

const computeRankFromMmr = (mmr: number | null | undefined) => {
    if (mmr == null || Number.isNaN(mmr as number)) return null as null | { name: string; slug: string };
    const tier = RANK_TIERS.find(t => (mmr as number) >= t.min && (mmr as number) <= t.max) || RANK_TIERS[RANK_TIERS.length - 1];
    return {name: tier.name, slug: tier.slug};
};

const computeRankProgress = (mmr: number | null | undefined) => {
    if (mmr == null || Number.isNaN(mmr as number)) return null as null | { remaining: number | null };
    const currentIndex = RANK_TIERS.findIndex(t => (mmr as number) >= t.min && (mmr as number) <= t.max);
    if (currentIndex < 0) return {remaining: null};
    const currentTier = RANK_TIERS[currentIndex];
    const nextTier = RANK_TIERS[Math.min(currentIndex + 1, RANK_TIERS.length - 1)];
    if (!nextTier || nextTier.slug === currentTier.slug) return {remaining: 0};
    const remain = Math.max(0, nextTier.min - (mmr as number));
    return {remaining: remain};
};

const computeStreak = (history: number[]) => {
    if (!Array.isArray(history) || history.length < 2) return null as null | { type: "win" | "loss"; length: number; totalDelta: number };
    let lastDelta = history[history.length - 1] - history[history.length - 2];
    if (lastDelta === 0) return null;
    let type: "win" | "loss" = lastDelta > 0 ? "win" : "loss";
    let length = 1;
    let totalDelta = lastDelta;
    for (let i = history.length - 2; i > 0; i--) {
        const delta = history[i] - history[i - 1];
        if ((type === "win" && delta > 0) || (type === "loss" && delta < 0)) {
            length++;
            totalDelta += delta;
        } else {
            break;
        }
    }
    return {type, length, totalDelta};
};

const computeSingleDelta = (history: number[]) => {
    if (!Array.isArray(history) || history.length < 2) return null as null | { totalDelta: number };
    return {totalDelta: history[history.length - 1] - history[history.length - 2]};
};

const getRankIconPath = (slug: string) => {
    const iconPath = path.resolve(process.cwd(), "resources", "rank-icons", `${slug}.png`);
    return fs.existsSync(iconPath) ? iconPath : "";
};

const baseCSS = `
  @font-face { font-family: Inter; src: local('Inter'), local('Segoe UI'); }
  body { margin: 0; background: transparent; }
  .mmr-widget {
    min-width: 240px;
    max-width: 340px;
    padding: 1rem 1.25rem;
    border-radius: 20px;
    background: radial-gradient(circle at top, rgba(59, 68, 105, 0.55), rgba(8, 10, 14, 0.8));
    backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 18px 48px rgba(0,0,0,0.35);
    color: #f5f5f7;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    word-break: break-word;
    position: relative;
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  }
  .mmr-widget--wood { background: linear-gradient(160deg, rgba(59,41,25,0.95), rgba(28,19,12,0.95)); }
  .mmr-widget--copper { background: linear-gradient(160deg, rgba(128,53,27,0.95), rgba(62,21,10,0.95)); }
  .mmr-widget--iron { background: linear-gradient(160deg, rgba(78,75,73,0.95), rgba(35,35,35,0.95)); }
  .mmr-widget--bronze { background: linear-gradient(160deg, rgba(148,101,60,0.95), rgba(80,45,25,0.95)); }
  .mmr-widget--silver { background: linear-gradient(160deg, rgba(186,194,203,0.95), rgba(101,107,115,0.95)); }
  .mmr-widget--gold { background: linear-gradient(160deg, rgba(242,211,97,0.95), rgba(155,116,30,0.95)); }
  .mmr-widget--platinum { background: linear-gradient(160deg, rgba(82,186,202,0.95), rgba(32,96,109,0.95)); }
  .mmr-widget--diamond { background: linear-gradient(160deg, rgba(74,167,255,0.95), rgba(23,74,154,0.95)); }
  .mmr-widget--master { background: linear-gradient(160deg, rgba(148,18,36,0.95), rgba(10,3,6,0.96)); }
  .mmr-widget--grandmaster { background: linear-gradient(160deg, rgba(35,143,63,0.96), rgba(4,20,10,0.97)); }
  .mmr-header { display: flex; align-items: center; gap: 0.75rem; }
  .mmr-rank-icon { width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .mmr-rank-icon img { width: 100%; height: 100%; object-fit: cover; }
  .mmr-title { display: flex; flex-direction: column; gap: 2px; }
  .mmr-label { opacity: 0.8; font-size: 10px; }
  .mmr-value { font-size: 22px; letter-spacing: 0.04em; }
  .mmr-note { opacity: 0.9; font-size: 10px; text-transform: none; letter-spacing: normal; }
  .mmr-pair { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 0.8rem; }
  .mmr-block { display: flex; flex-direction: column; gap: 0.15rem; }
  .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 0.25rem 0; }
  .mmr-banner { display:flex; align-items:baseline; justify-content: space-between; gap: 0.75rem; background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.65rem 0.75rem; }
  .mmr-banner-label { font-size: 10px; opacity: 0.85; }
  .mmr-banner-elo { font-size: 26px; }
  .mmr-banner-delta.gain { color: #7CFF92; }
  .mmr-banner-delta.loss { color: #ff8080; }
  .mmr-banner-until { font-size: 11px; opacity: 0.9; }
`;

function buildHTML(stats: StatsInt) {
    const history = Array.isArray(stats.mmrHistory) ? stats.mmrHistory : [];
    const currentMmrValue = stats.mmr;
    const previousMmrValue = history.length > 1 ? history[history.length - 2] : null;
    const wins = (stats as any).wins ?? null;
    const losses = (stats as any).losses ?? null;
    const totalGamesRaw = stats.gamesPlayed;
    const totalGames = totalGamesRaw != null ? formatInteger(totalGamesRaw) : "?";
    const winRateNumber = stats.winRate;
    const winRate = formatPercent(winRateNumber);
    const rankLabel = computeRankFromMmr(currentMmrValue as number);
    const rankProgress = computeRankProgress(currentMmrValue as number);
    const streak = computeStreak(history);
    const mmrDeltaInfo = streak ?? computeSingleDelta(history);
    const mmrDelta = mmrDeltaInfo ? (mmrDeltaInfo as any).totalDelta : null;
    const streakSuffix = (streak && (streak as any).length > 1) ? ` (${(streak as any).length}${(streak as any).type === "win" ? "W" : "L"} streak)` : "";
    const eloDeltaMarkup = typeof mmrDelta === "number"
        ? `<span class="mmr-banner-delta ${mmrDelta >= 0 ? "gain" : "loss"}">${mmrDelta >= 0 ? "+" : "−"}${formatInteger(Math.abs(Math.round(mmrDelta))) } elo${streakSuffix}</span>`
        : "";
    const eloUntilValue = rankProgress && (rankProgress as any).remaining != null ? Math.max(0, Math.round((rankProgress as any).remaining)) : null;
    const eloUntilMarkup = eloUntilValue != null ? `<span class="mmr-banner-until">${formatInteger(eloUntilValue)} elo until rank up</span>` : `<span class="mmr-banner-until">max rank</span>`;
    const bannerTheme = "mmr-banner--default";
    const currentBanner = currentMmrValue ? `
      <div class="mmr-banner ${bannerTheme}">
        <div>
          <div class="mmr-banner-label">current elo</div>
          <div class="mmr-banner-elo">${formatInteger(currentMmrValue as number)}</div>
        </div>
        <div>
          ${eloUntilMarkup}
          ${eloDeltaMarkup}
        </div>
      </div>` : "";

    const previousBanner = previousMmrValue != null ? `
      <div class="mmr-banner ${bannerTheme}">
        <div>
          <div class="mmr-banner-label">previous</div>
          <div class="mmr-banner-elo">${formatInteger(previousMmrValue)}</div>
        </div>
      </div>` : "";

    const lbRank = stats.rank > 0 ? `#${formatInteger(stats.rank)}` : "—";

    const rankSlug = (rankLabel as any)?.slug ?? "";
    const iconPath = rankSlug ? getRankIconPath(rankSlug) : "";
    const iconUrl = iconPath ? `file://${iconPath}` : "";
    const themeClass = rankSlug ? ` mmr-widget--${rankSlug}` : " mmr-widget--default";

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>${baseCSS}</style>
    </head>
    <body>
      <div id="card" class="mmr-widget${themeClass}">
        <div class="mmr-header">
          <div class="mmr-rank-icon">${iconUrl ? `<img src="${iconUrl}" alt="${(rankLabel as any)?.name ?? ""}"/>` : ""}</div>
          <div class="mmr-title">
            <div class="mmr-label">rank</div>
            <div class="mmr-value">${(rankLabel as any)?.name ?? "Unranked"}</div>
            <div class="mmr-note">Leaderboard: ${lbRank}</div>
          </div>
        </div>
        <div class="divider"></div>
        ${currentBanner}
        ${previousBanner}
        <div class="divider"></div>
        <div class="mmr-pair">
          <div class="mmr-block">
            <div class="mmr-label">games</div>
            <div class="mmr-value">${totalGames}</div>
            <div class="mmr-note">${wins != null && losses != null ? `${formatInteger(wins)}W - ${formatInteger(losses)}L` : ""}</div>
          </div>
          <div class="mmr-block">
            <div class="mmr-label">win rate</div>
            <div class="mmr-value">${winRate}</div>
            <div class="mmr-note">last change: ${formatInteger((stats as any).ratingChange ?? 0)}</div>
          </div>
        </div>
      </div>
    </body>
    </html>`;
}

export const generateStatsImage = async (stats: StatsInt): Promise<Buffer> => {
    const html = buildHTML(stats);
    const browser = await puppeteer.launch({headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"]});
    try {
        const page = await browser.newPage();
        await page.setViewport({width: 380, height: 10, deviceScaleFactor: 2});
        await page.setContent(html, {waitUntil: ["domcontentloaded", "load", "networkidle0"]});
        // Wait for the card element
        const el = await page.$('#card');
        if (!el) {
            throw new Error('Failed to render stats card');
        }
        // Ensure images have loaded (if any)
        await page.evaluate(async () => {
            const imgs = Array.from(document.images);
            await Promise.all(imgs.map(img => img.complete ? Promise.resolve(true) : new Promise(res => { img.onload = () => res(true); (img as any).onerror = () => res(true); })));
        });
        const buffer = await (el as any).screenshot({type: 'png'}) as Buffer;
        await page.close();
        return buffer;
    } finally {
        await browser.close();
    }
};

export default generateStatsImage;
