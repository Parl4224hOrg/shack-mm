import {Guild} from "discord.js";

export const getGuildMember = async (id: string, guild: Guild) => {
    const member = guild.members.cache.get(id);

    if (member) {
        return member;
    } else {
        return guild.members.fetch(id);
    }
}