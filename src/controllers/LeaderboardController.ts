import cron from "node-cron";
import table from "text-table";
import {getTopTwenty} from "../modules/getters/getStats";
import {getUserById} from "../modules/getters/getUser";
import {getRank} from "../utility/ranking";

export class LeaderboardControllerClass {
    leaderboardCacheSND: string = '';
    private updateLoop = cron.schedule('*/5 * * * * *', async () => {
        const newBoard  = await this.getLeaderboard();
        if (this.leaderboardCacheSND != newBoard) {
            this.leaderboardCacheSND = newBoard;
            this.changed = true;
        }
    });
    changed = false;

    constructor() {
        this.updateLoop.start();
    }

    async getLeaderboard(): Promise<string> {
        const stats = await getTopTwenty("SND");
        const tablePlayers: string[][] = [[" Rank ", "Player", " Rank-Rating ", " Games Played ", " Win Rate "]];
        let i = 0;
        for (let stat of stats) {
            i++;
            const player = await getUserById(stat.userId);
            tablePlayers.push([String(i), " " + player.name + " ", " " + String(getRank(stat.mmr).name) + "-" + String(stat.mmr.toFixed(1)) + " ", String(stat.gamesPlayed), String((stat.winRate * 100).toFixed(1) + "%")])
        }
        return "```" + table(tablePlayers, {hsep: '|', align: ['c', 'c', 'c', 'c', 'c', 'c']}) + "```";
    }
}
