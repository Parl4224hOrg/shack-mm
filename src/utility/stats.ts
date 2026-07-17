import Handlebars from "handlebars";
import puppeteer, {Browser, Page} from "puppeteer";
import * as path from "node:path";
import fs from "fs";
import {join} from "path";
import {StatsInt} from "../database/models/StatsModel";
import {getRank} from "./ranking";
import {formatMmrForStatsImage, formatRemainingMmrForStatsImage} from "./stats-formatting";
import tokens from "../tokens";

let browserPromise: Promise<Browser> | null = null;
let browserIdleTimer: NodeJS.Timeout | null = null;
let activePages = 0;
let templateFn: Handlebars.TemplateDelegate | null = null;
const PUPPETEER_LAUNCH_ARGS = [
    "--disable-web-security",
    "--allow-file-access-from-files",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-crash-reporter",
    "--disable-breakpad",
    "--disable-crashpad",
    "--no-zygote",
];
const configuredBrowserIdleTimeoutMs = Number(process.env.STATS_BROWSER_IDLE_MS ?? 60_000);
const BROWSER_IDLE_TIMEOUT_MS = Number.isFinite(configuredBrowserIdleTimeoutMs)
    ? configuredBrowserIdleTimeoutMs
    : 60_000;

function errorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.stack ?? error.message;
    }

    return String(error);
}

function describeStats(stats: StatsInt) {
    return {
        statsId: String(stats._id ?? "unknown"),
        userId: String(stats.userId ?? "unknown"),
        queueId: stats.queueId,
        mmr: stats.mmr,
        rank: stats.rank,
        gamesPlayed: stats.gamesPlayed,
        gamesPlayedSinceReset: stats.gamesPlayedSinceReset,
        mmrHistoryLength: stats.mmrHistory?.length ?? 0,
        gameHistoryLength: stats.gameHistory?.length ?? 0,
    };
}

// Launch or reuse the single browser
async function getBrowser(): Promise<Browser> {
    clearStatsBrowserIdleTimer();

    if (!browserPromise) {
        const nextBrowserPromise = puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: PUPPETEER_LAUNCH_ARGS,
        });

        browserPromise = nextBrowserPromise;

        nextBrowserPromise
            .then((browser) => {
                browser.once("disconnected", () => {
                    if (browserPromise === nextBrowserPromise) {
                        browserPromise = null;
                    }
                });
            })
            .catch((error) => {
                console.error("[stats-image] Puppeteer launch failed", errorMessage(error));
                if (browserPromise === nextBrowserPromise) {
                    browserPromise = null;
                }
            });
    }
    return browserPromise;
}

export async function closeStatsBrowser(): Promise<void> {
    clearStatsBrowserIdleTimer();

    const browserToClose = browserPromise;
    browserPromise = null;

    if (!browserToClose) {
        return;
    }

    const browser = await browserToClose;
    await browser.close();
}

function clearStatsBrowserIdleTimer() {
    if (!browserIdleTimer) {
        return;
    }

    clearTimeout(browserIdleTimer);
    browserIdleTimer = null;
}

function scheduleStatsBrowserIdleClose() {
    if (activePages > 0 || !browserPromise || browserIdleTimer || BROWSER_IDLE_TIMEOUT_MS <= 0) {
        return;
    }

    browserIdleTimer = setTimeout(() => {
        browserIdleTimer = null;
        closeStatsBrowser().catch((error) => console.error("Failed to close idle stats browser", error));
    }, BROWSER_IDLE_TIMEOUT_MS);

    browserIdleTimer.unref();
}

// Load + compile template once
async function getTemplate(): Promise<Handlebars.TemplateDelegate> {
    if (!templateFn) {
        const mountedFolder = join(process.cwd(), "../../mounted");
        const filePath = path.join(mountedFolder, "RankCardTemplate.html");

        try {
            const src = fs.readFileSync(filePath, "utf8");
            templateFn = Handlebars.compile(src.toString());
        } catch (error) {
            console.error("[stats-image] Failed to load stats template", {
                filePath,
                mountedFolder,
                cwd: process.cwd(),
                error: errorMessage(error),
            });
            throw error;
        }
    }
    return templateFn;
}

function getImageBase64(rank: string) {
    const filePath = resolveAssetPath(`${rank}.png`, [
        path.join(process.cwd(), "resources", "rank-icons"),
        path.join(process.cwd(), "../../mounted"),
    ]);
    return fs.readFileSync(filePath, {encoding: 'base64'});
}

function getWlImageBase64(result: "win" | "loss") {
    const fileName = result === "win" ? "win.png" : "lose.png";
    const filePath = resolveAssetPath(fileName, [
        path.join(process.cwd(), "resources", "WL"),
        path.join(process.cwd(), "../../mounted"),
    ]);
    return fs.readFileSync(filePath, {encoding: "base64"});
}

function resolveAssetPath(fileName: string, folders: string[]) {
    const attemptedPaths: string[] = [];
    for (const folder of folders) {
        const candidate = path.join(folder, fileName);
        attemptedPaths.push(candidate);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    console.error("[stats-image] Stats asset not found", {
        fileName,
        attemptedPaths,
        cwd: process.cwd(),
    });
    throw new Error(`Asset not found: ${fileName}; attempted paths: ${attemptedPaths.join(", ")}`);
}

function getMinMaxMmr(stats: StatsInt) {
    let min = 10000;
    let minMatchNumber = 0;
    let max = -10000;
    let maxMatchNumber = 0;

    let matchNumber = 10;
    for (let mmr of stats.mmrHistory.slice((stats.gamesPlayed - stats.gamesPlayedSinceReset) + 10)) {
        matchNumber++;
        if (mmr < min) {
            min = mmr;
            minMatchNumber = matchNumber;
        } else if (mmr > max) {
            max = mmr;
            maxMatchNumber = matchNumber;
        }
    }
    return {min, max, minMatchNumber, maxMatchNumber};
}

function getNextRankThreshold(mmr: number): number | null {
    const nextRank = tokens.Ranks
        .filter((rank) => rank.threshold > mmr)
        .sort((a, b) => a.threshold - b.threshold)[0];

    return nextRank?.threshold ?? null;
}

function getRankRangeText(rankThreshold: number): string {
    const nextThreshold = getNextRankThreshold(rankThreshold);

    if (nextThreshold === null) {
        return `≥${rankThreshold}`;
    }

    if (rankThreshold <= 0) {
        return `≤${nextThreshold - 1}`;
    }

    return `${rankThreshold}-${nextThreshold - 1}`;
}

type MmrStreak = {
    streakLength: number;
    streakType: "win" | "loss";
    mmrChange: number; // positive for wins, negative for losses
};

export function getLatestMmrStreak(history: number[]): MmrStreak {
    if (history.length < 2) {
        return { streakLength: 0, streakType: "win", mmrChange: 0 };
    }

    const n = history.length;
    let streakLength = 0;

    const last = history[n - 1];
    const prev = history[n - 2];

    const streakType: "win" | "loss" = last > prev ? "win" : "loss";

    let i = n - 1;
    while (i > 0) {
        const curr = history[i];
        const before = history[i - 1];

        const isWin = curr > before;
        const isLoss = curr < before;

        if (streakType == "win" && isWin) {
            streakLength++;
        } else if (streakType == "loss" && isLoss) {
            streakLength++;
        } else {
            break;
        }

        i--;
    }

    const mmrChange = last - history[i];

    return {
        streakLength,
        streakType,
        mmrChange,
    };
}



export const generateStatsImage = async (stats: StatsInt, name: string): Promise<Buffer> => {
    const gradients = {
        wood: "linear-gradient(0deg, #7a3a1e 0%, #4f200f 45%, #2b1209 100%)",
        copper: "linear-gradient(0deg, #c97b63 0%, #a35741 45%, #6b3527 100%)",
        iron: "linear-gradient(0deg, #8c8a81 0%, #66635b 45%, #3c3a36 100%)",
        bronze: "linear-gradient(0deg, #d6a55a 0%, #b08138 45%, #6d4e1f 100%)",
        silver: "linear-gradient(0deg, #d0cfd3 0%, #aaa9ad 45%, #78787b 100%)",
        gold: "linear-gradient(180deg, #ffe866 0%, #ffd700 45%, #a88f00 100%)",
        platinum: "linear-gradient(0deg, #52d3c0 0%, #24a18e 45%, #0f5e52 100%)",
        diamond: "linear-gradient(0deg, #4ddcff 0%, #00c3ff 45%, #00719b 100%)",
        master: "linear-gradient(0deg, #ff6b80 0%, #ff243a 45%, #a30b1c 100%)",
        grandmaster: "linear-gradient(0deg, #78ff72 0%, #34e718 45%, #1a8a0b 100%)"
    };

    const rank = getRank(stats.mmr);
    let nextRankThreshold: number | null;
    let minMaxMmr: ReturnType<typeof getMinMaxMmr>;
    let streak: MmrStreak;
    let historyItems: string[];
    let wlIcons: {win: string, loss: string};

    try {
        nextRankThreshold = getNextRankThreshold(stats.mmr);
        minMaxMmr = getMinMaxMmr(stats);
        streak = getLatestMmrStreak(stats.mmrHistory);
        historyItems = getRecentHistory(stats.gameHistory, 10);
        wlIcons = {
            win: getWlImageBase64("win"),
            loss: getWlImageBase64("loss"),
        };
    } catch (error) {
        console.error("[stats-image] Failed while preparing stats image data", {
            playerName: name,
            stats: describeStats(stats),
            error: errorMessage(error),
        });
        throw error;
    }

    const template = await getTemplate();

    let outputHtml: string;
    try {
        outputHtml = template({
            gradient: gradients[rank.name.toLowerCase() as keyof typeof gradients],
            playerName: name,
            highestMmr: formatMmrForStatsImage(minMaxMmr.max),
            highestMmrMatchNumber: minMaxMmr.maxMatchNumber,
            highestIcon: `data:image/png;base64,${getImageBase64(getRank(minMaxMmr.max).name.toLowerCase())}`,
            lowestMmr: formatMmrForStatsImage(minMaxMmr.min),
            lowestMmrMatchNumber: minMaxMmr.minMatchNumber,
            lowestIcon: `data:image/png;base64,${getImageBase64(getRank(minMaxMmr.min).name.toLowerCase())}`,
            rankNumber: stats.rank,
            winRate: (stats.winRate * 100).toFixed(1),
            totalGames: stats.gamesPlayed,
            wins: stats.wins,
            losses: stats.losses,
            mmr: formatMmrForStatsImage(stats.mmr),
            mmrStreakText: streak.mmrChange > 0 ? `+${streak.mmrChange.toFixed(1)}` : streak.mmrChange.toFixed(1),
            streakText: `${streak.streakLength}${streak.streakType === "win" ? "W" : "L"}`,
            streakColor: streak.streakType === "win" ? "--accent-green" : "--accent-red",
            mmrUntilRankUp: nextRankThreshold !== null ? formatRemainingMmrForStatsImage(nextRankThreshold - stats.mmr) : "N/A",
            rankImage: `data:image/png;base64,${getImageBase64(rank.name.toLowerCase())}`,
            rankName: rank.name,
            historyItems: historyItems.map((result) => {
                if (result === "win") {
                    return {label: "W", src: `data:image/png;base64,${wlIcons.win}`, isDraw: false};
                }
                if (result === "loss") {
                    return {label: "L", src: `data:image/png;base64,${wlIcons.loss}`, isDraw: false};
                }
                return {label: "D", isDraw: true};
            }),
            rankRange: getRankRangeText(rank.threshold),
        });
    } catch (error) {
        console.error("[stats-image] Failed while rendering stats HTML", {
            playerName: name,
            rankName: rank.name,
            minMaxMmr,
            error: errorMessage(error),
        });
        throw error;
    }

    const browser = await getBrowser();
    let page: Page | null = null;

    try {
        page = await browser.newPage();
        activePages++;

        await page.setViewport({
            width: 360,
            height: 600,
            deviceScaleFactor: 2, // for sharper text
        });

        await page.setContent(outputHtml, {
            waitUntil: "load",
        });

        return await page.screenshot({
            type: "png",
            fullPage: true,
            omitBackground: true
        }) as Buffer;
    } catch (error) {
        console.error("[stats-image] Failed while capturing stats image", {
            playerName: name,
            activePages,
            stats: describeStats(stats),
            error: errorMessage(error),
        });
        throw error;
    } finally {
        try {
            await page?.close();
        } finally {
            if (page) {
                activePages--;
            }
            scheduleStatsBrowserIdleClose();
        }
    }
};
function getRecentHistory(history: string[], count: number): string[] {
    if (history.length <= count) {
        return history.slice(0);
    }
    return history.slice(-count);
}
