import {GuildMember, PartialGuildMember} from "discord.js";

export const onJoin = async (member: GuildMember | PartialGuildMember) => {
    console.log(member.id);
}