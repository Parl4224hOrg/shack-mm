import {GuildMember, PartialGuildMember, TextChannel} from "discord.js";
import tokens from "../tokens";
import moment from "moment";
import {getUserByUser} from "../modules/getters/getUser";
import {Data} from "../data";

export const onJoin = async (member: GuildMember | PartialGuildMember, data: Data) => {
    const dbUser = await getUserByUser(member, data);
    if (dbUser.muteUntil > moment().unix() || dbUser.muteUntil < 0 || dbUser.frozen) {
        await member.roles.add(tokens.MutedRole);
    }
    const time = new Date();
    time.setDate(time.getDate() - 1)
    if (member.user.createdAt >= time) {
        const channel = await member.guild.channels.fetch(tokens.PotentialAltsChannel) as TextChannel;
        await channel.send({
            content: `<@${dbUser.id}>'s account was created within the past 24 hours, they may be an alt.`,
            allowedMentions: {roles: [tokens.ModRole]}
        });
    }
}