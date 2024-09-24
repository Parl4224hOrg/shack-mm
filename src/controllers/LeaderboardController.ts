import cron from "node-cron";
import table from "text-table";
import {getTopTwenty} from "../modules/getters/getStats";
import {getUserById} from "../modules/getters/getUser";
import {getRank} from "../utility/ranking";
import {Data} from "../data";

export class LeaderboardControllerClass {
    leaderboardCacheSND: string = '';
    private updateLoop = cron.schedule('*/5 * * * * *', async () => {
        const newBoard  = await this.getLeaderboard(this.data);
        if (this.leaderboardCacheSND != newBoard) {
            this.leaderboardCacheSND = newBoard;
            this.changed = true;
        }
    });
    changed = false;
    data: Data;

    constructor(data: Data) {
        this.updateLoop.start();
        this.data = data
    }

    async getLeaderboard(data: Data): Promise<string> {
        const stats = await getTopTwenty("SND");
        const tablePlayers: string[][] = [[" Rank ", "Player", " Rank-Rating ", " Games Played ", " Total Games ", " Win Rate "]];
        let i = 0;
        for (let stat of stats) {
            i++;
            const player = await getUserById(stat.userId, data);
            tablePlayers.push([String(i), " " + player.name + " ", " " + String(getRank(stat.mmr).name) + "-" + String(stat.mmr.toFixed(1)) + " ", String(stat.gamesPlayedSinceReset), String(stat.gamesPlayed), String((stat.winRate * 100).toFixed(1) + "%")])
        }
        return "```" + table(tablePlayers, {hsep: '|', align: ['c', 'c', 'c', 'c', 'c', 'c']}) + "```";
    }
}
