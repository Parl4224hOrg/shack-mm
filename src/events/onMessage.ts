import {Message, MessageReferenceType} from "discord.js";
import {logWarn} from "../loggers";
import tokens from "../tokens";

export const onMessage = async (message: Message) => {
    try {
        if (message.channelId == tokens.ScoreboardChannel) {
            if (message.attachments.size < 1) {
                await message.delete();
            }
        }
        if (message.content == "!no") {
            const guild = await message.client.guilds.fetch(tokens.GuildID);
            const member = await guild.members.fetch(message.member!.id);
            for (let role of member.roles.cache.values()) {
                if (tokens.Mods.includes(role.id)) {
                    await message.reply(tokens.NoMessage);
                    break;
                }
            }
        }
        if (message.reference?.type == MessageReferenceType.Forward) {
            console.log("forwarded message detected");
        }
    } catch (e) {
        await logWarn("Message could not be processed", message.client);
    }
}