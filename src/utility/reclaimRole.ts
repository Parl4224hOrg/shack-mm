import {GuildMember, PartialGuildMember} from "discord.js";
import {Data} from "../data";
import {getUserByUser} from "../modules/getters/getUser";
import {getStats} from "../modules/getters/getStats";
import {getRank} from "./ranking";
import tokens from "../tokens";

export type ReclaimRoleResult =
    | {eligible: true; rankName: string}
    | {eligible: false};

/** Restores the member's SND rank role once they have completed placements. */
export const reclaimRankRole = async (
    member: GuildMember | PartialGuildMember,
    data: Data,
): Promise<ReclaimRoleResult> => {
    const dbUser = await getUserByUser(member, data);
    const stats = await getStats(dbUser._id, "SND");

    if (stats.gamesPlayedSinceReset < 10) {
        return {eligible: false};
    }

    const rankRoleIds = tokens.Ranks.map((rank) => rank.roleId);
    const assignedRankRoleIds = member.roles.cache
        .filter((role) => rankRoleIds.includes(role.id))
        .map((role) => role.id);

    if (assignedRankRoleIds.length > 0) {
        await member.roles.remove(assignedRankRoleIds);
    }

    const rank = getRank(stats.mmr);
    await member.roles.add(rank.roleId);
    return {eligible: true, rankName: rank.name};
};
