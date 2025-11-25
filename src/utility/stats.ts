import Handlebars from "handlebars";
import puppeteer, {Browser} from "puppeteer";
import * as path from "node:path";
import fs from "fs";
import {join} from "path";
import {StatsInt} from "../database/models/StatsModel";
import {getRank} from "./ranking";

let browserPromise: Promise<Browser> | null = null;
let templateFn: Handlebars.TemplateDelegate | null = null;

// Launch or reuse the single browser
async function getBrowser(): Promise<Browser> {
    if (!browserPromise) {
        browserPromise = puppeteer.launch({
            headless: true,
            args: ["--disable-web-security", "--allow-file-access-from-files", "--no-sandbox"],
        });
    }
    return browserPromise;
}

// Load + compile template once
async function getTemplate(): Promise<Handlebars.TemplateDelegate> {
    if (!templateFn) {
        const mountedFolder = join(process.cwd(), "../../mounted");
        const filePath = path.join(mountedFolder, "RankCardTemplate.html");
        const src = fs.readFileSync(filePath, "utf8");
        templateFn = Handlebars.compile(src.toString());
    }
    return templateFn;
}

function getImageBase64(rank: string) {
    const mountedFolder = join(process.cwd(), "../../mounted");
    const filePath = path.join(mountedFolder, `${rank}.png`);
    return fs.readFileSync(filePath, {encoding: 'base64'});
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
    const minMaxMmr = getMinMaxMmr(stats);
    const streak = getLatestMmrStreak(stats.mmrHistory);

    const template = await getTemplate();

    const outputHtml = template({
        gradient: gradients[rank.name.toLowerCase() as keyof typeof gradients],
        playerName: name,
        highestMmr: minMaxMmr.max.toFixed(2),
        highestMmrMatchNumber: minMaxMmr.maxMatchNumber,
        highestIcon: `data:image/png;base64,${getRank(minMaxMmr.max).name.toLowerCase()}`,
        lowestMmr: minMaxMmr.min.toFixed(2),
        lowestMmrMatchNumber: minMaxMmr.minMatchNumber,
        lowestIcon: `data:image/png;base64,${getRank(minMaxMmr.min).name.toLowerCase()}`,
        rankNumber: stats.rank,
        winRate: (stats.winRate * 100).toFixed(1),
        totalGames: stats.gamesPlayed,
        wins: stats.wins,
        losses: stats.losses,
        mmr: stats.mmr.toFixed(2),
        mmrStreakText: streak.mmrChange > 0 ? `+${streak.mmrChange.toFixed(1)}` : streak.mmrChange.toFixed(1),
        streakText: `${streak.streakLength}${streak.streakType === "win" ? "W" : "L"}`,
        streakColor: streak.streakType === "win" ? "--accent-green" : "--accent-red",
        mmrUntilRankUp: rank.max < 100000 ? (rank.max - stats.mmr).toFixed(2) : "N/A",
        rankImage: `data:image/png;base64,${getImageBase64(rank.name.toLowerCase())}`,
        rankName: rank.name,
        rankRange: rank.threshold > 0 ? rank.max < 100000 ? `${rank.threshold}-${rank.max}` : `≥${rank.threshold}` : `≤${rank.max}`,
    });

    const browser = await getBrowser();

    const page = await browser.newPage();

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
};
