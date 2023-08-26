import cron from "node-cron";
import cacheController from "./CacheController";
import table from "text-table";
import {getRank} from "../utility/ranking";

export class LeaderboardControllerClass {
    private leaderboardCacheSND: string = '';
    private updateLoop = cron.schedule('*/5 * * * *', async () => {
        this.leaderboardCacheSND = await this.getLeaderboard();
    })

    constructor() {
        this.updateLoop.start();
        console.log('here')
    }

    async getLeaderboard(): Promise<string> {
        const stats = await cacheController.getTopTwenty('SND');
        const tablePlayers: string[][] = [[]];
        let i = 0;
        for (let stat of stats) {
            i++;
            const player = await cacheController.getUser(stat.userId);
            tablePlayers.push([String(i), player.name, getRank(stat.mmr).name, String(stat.gamesPlayed), String(stat.winRate)])
        }
        console.log(table(tablePlayers, {hsep: '|', align: ['c', 'c', 'c', 'c', 'c']}))
        return table(tablePlayers, {hsep: '|', align: ['c', 'c', 'c', 'c', 'c']});
    }
}

export default new LeaderboardControllerClass();
