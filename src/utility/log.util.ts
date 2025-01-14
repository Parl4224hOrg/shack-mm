import {Guild, TextChannel, User} from "discord.js";
import tokens from "../tokens";

export const logPlaytest = async (user: User, remove: boolean, playtestId: string, guild: Guild) => {
    const channel = await guild.channels.fetch(tokens.PlaytestLogChannel) as TextChannel;
    await channel.send(`${remove ? "Removed" : "Added"} <@${user.id}> | ${user.username} from playtest ${playtestId}`);
}