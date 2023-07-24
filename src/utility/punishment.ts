import {ObjectId} from "mongoose";
import {getUserById} from "../modules/getters/getUser";
import moment from "moment/moment";
import {Guild, TextChannel} from "discord.js";
import tokens from "../tokens";

export const abandon = async (userId: ObjectId, guild: Guild) => {
    const user = await getUserById(userId);
    const now = moment().unix();
    switch (user.banCounter) {
        case 0: user.lastBan = now; user.banUntil = now + 30 * 60; break;
        case 1: user.lastBan = now; user.banUntil = now + 60 * 60; break;
        case 2: user.lastBan = now; user.banUntil = now + 8 * 60 * 60; break;
        case 3: user.lastBan = now; user.banUntil = now + 24 * 60 * 60; break;
        case 4: user.lastBan = now; user.banUntil = now + 48 * 60 * 60; break;
        case 5: user.lastBan = now; user.banUntil = now + 96 * 60 * 60; break;
        default: user.lastBan = now; user.banUntil = now + 192 * 60 * 60; break;
    }
    user.banCounter++;

    const channel = await guild.channels.fetch(tokens.GeneralChannel) as TextChannel;
    await channel.send(`<@${user.id}> has abandoned a match and been given a cooldown`);
}