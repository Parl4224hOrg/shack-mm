import {ObjectId} from "mongoose";
import {getUserById} from "../modules/getters/getUser";
import moment from "moment/moment";
import {Guild, TextChannel} from "discord.js";
import tokens from "../tokens";
import {updateUser} from "../modules/updaters/updateUser";
import {grammaticalTime} from "./grammatical";
import ActionModel, {Actions} from "../database/models/ActionModel";
import {Data} from "../data";

export const abandon = async (userId: ObjectId, discordId: string, guild: Guild, acceptFail: boolean, data: Data) => {
    const user = await getUserById(userId, data);
    const now = moment().unix();
    switch (user.banCounter) {
        case 0: user.lastBan = now; user.banUntil = now + 30 * 60; user.lastReduction = now; user.gamesPlayedSinceReduction = 0; break;
        case 1: user.lastBan = now; user.banUntil = now + 8 * 60 * 60; user.lastReduction = now; user.gamesPlayedSinceReduction = 0; break;
        default: user.lastBan = now; user.banUntil = now + 2 ** (user.banCounter - 1) * 12 * 60 * 60; user.lastReduction = now; user.gamesPlayedSinceReduction = 0; break;
    }
    user.banCounter++;
    await updateUser(user, data);

    await ActionModel.create({
        action: acceptFail ? Actions.AcceptFail : Actions.Abandon,
        modId: "1058875839296577586",
        userId: discordId,
        reason: "Auto punishment by bot",
        time: now,
        actionData: `User was punished for ${grammaticalTime(user.banUntil - now)}\nWith a ban counter of ${user.banCounter} after the punishment`,
    })

    const channel = await guild.channels.fetch(tokens.GeneralChannel) as TextChannel;
    if (acceptFail) {
        await channel.send(`<@${user.id}> has failed to accept a match and been given a cooldown of ${grammaticalTime(user.banUntil - now)}`);
    } else {
        await channel.send(`<@${user.id}> has abandoned a match and been given a cooldown of ${grammaticalTime(user.banUntil - now)}`);
    }

    return;
}