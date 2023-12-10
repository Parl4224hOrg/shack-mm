import tokens from "../tokens";
import {Rank} from "../interfaces/Internal";
import {GameUser} from "../interfaces/Game";
import {getStats} from "../modules/getters/getStats";
import {Client, GuildMember, Role} from "discord.js";

export const getRank = (mmr: number): Rank => {
    let highRank: Rank = {name: 'unranked', threshold: -999999, roleId: ''};
    for (let rank of tokens.Ranks) {
        if (rank.threshold <= mmr && rank.threshold >= highRank.threshold) {
            highRank = rank;
        }
    }
    return highRank!;
}

export const roleRemovalCallback = async (value: Role, member: GuildMember) => {
    if (tokens.RankRoles.includes(value.id)) {
        await member.roles.remove(value.id);
    }
}

export const updateRanks = async (users: GameUser[], client: Client) => {
    const guild = await client.guilds!.fetch(tokens.GuildID);
    for (let user of users) {
        const stats = await getStats(user.dbId,  "SND");
        const member = await guild.members.fetch(user.discordId);
        member.roles.cache.forEach((value) => {roleRemovalCallback(value, member)});
        if (stats.gamesPlayed >= 10) {
            const rank = getRank(stats.mmr);
            await member.roles.add(rank.roleId);
        }
    }
}
