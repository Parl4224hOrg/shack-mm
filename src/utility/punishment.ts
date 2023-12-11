import {ObjectId} from "mongoose";
import {getUserById} from "../modules/getters/getUser";
import moment from "moment/moment";
import {Guild, TextChannel} from "discord.js";
import tokens from "../tokens";
import {updateUser} from "../modules/updaters/updateUser";
import {grammaticalTime} from "./grammatical";

export const abandon = async (userId: ObjectId, guild: Guild, acceptFail: boolean) => {
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
    await updateUser(user);

    const channel = await guild.channels.fetch(tokens.GeneralChannel) as TextChannel;
    if (acceptFail) {
        await channel.send(`<@${user.id}> has failed to accept a match and been given a cooldown of ${grammaticalTime(user.banUntil - now)}`);
    } else {
        await channel.send(`<@${user.id}> has abandoned a match and been given a cooldown of ${grammaticalTime(user.banUntil - now)}`);
    }

    return;
}