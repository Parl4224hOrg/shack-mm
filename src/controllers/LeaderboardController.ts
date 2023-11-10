import cron from "node-cron";
import table from "text-table";
import {getRank} from "../utility/ranking";
import {getTopTwenty} from "../modules/getters/getStats";
import {getUserById} from "../modules/getters/getUser";

export class LeaderboardControllerClass {
    private leaderboardCacheSND: string = '';
    private updateLoop = cron.schedule('*/5 * * * *', async () => {
        this.leaderboardCacheSND = await this.getLeaderboard();
    })

    constructor() {
        this.updateLoop.start();
    }

    async getLeaderboard(): Promise<string> {
        const stats = await getTopTwenty("SND");
        const tablePlayers: string[][] = [[]];
        let i = 0;
        for (let stat of stats) {
            i++;
            const player = await getUserById(stat.userId);
            tablePlayers.push([String(i), player.name, getRank(stat.mmr).name, String(stat.gamesPlayed), String(stat.winRate)])
        }
        this.leaderboardCacheSND = table(tablePlayers, {hsep: '|', align: ['c', 'c', 'c', 'c', 'c']})
        return this.leaderboardCacheSND;
    }
}

export default new LeaderboardControllerClass();
