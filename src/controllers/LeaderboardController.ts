import table from "text-table";
import {getTopTwenty} from "../modules/getters/getStats";
import {getUserById} from "../modules/getters/getUser";
import {getRank} from "../utility/ranking";
import {Data} from "../data";
import tokens from "../tokens";
import {TextChannel} from "discord.js";

export class LeaderboardControllerClass {
    data: Data;

    constructor(data: Data) {
        this.data = data
    }

    async setLeaderboard(): Promise<void> {
        const channel = await this.data.client.channels.fetch(tokens.LeaderboardChannel) as TextChannel;
        const message = await channel.messages.fetch(tokens.LeaderboardMessage);
        await message.edit({content: await this.getLeaderboard(), components: []});
    }

    async getLeaderboard(): Promise<string> {
        const stats = await getTopTwenty("SND");
        const tablePlayers: string[][] = [[" Rank ", "Player", " Rank-Rating ", " Games Played ", " Total Games ", " Win Rate "]];
        let i = 0;
        for (let stat of stats) {
            i++;
            const player = await getUserById(stat.userId, this.data);
            tablePlayers.push([String(i), " " + player.name + " ", " " + String(getRank(stat.mmr).name) + "-" + String(stat.mmr.toFixed(1)) + " ", String(stat.gamesPlayedSinceReset), String(stat.gamesPlayed), String((stat.winRate * 100).toFixed(1) + "%")])
        }
        return "```" + table(tablePlayers, {hsep: '|', align: ['c', 'c', 'c', 'c', 'c', 'c']}) + "```";
    }
}
