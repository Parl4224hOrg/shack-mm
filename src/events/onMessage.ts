import {Message} from "discord.js";
import {logWarn} from "../loggers";
import tokens from "../tokens";

export const onMessage = async (message: Message) => {
    try {
        if (message.channelId == tokens.ScoreboardChannel) {
            if (message.attachments.size < 1) {
                await message.delete();
            }
        }
    } catch (e) {
        await logWarn("Message could not be processed", message.client);
    }
}