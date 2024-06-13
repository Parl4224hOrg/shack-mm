import {ObjectId} from "mongoose";
import {getUserById} from "../modules/getters/getUser";
import moment from "moment/moment";
import {Guild, TextChannel} from "discord.js";
import tokens from "../tokens";
import {updateUser} from "../modules/updaters/updateUser";
import {grammaticalTime} from "./grammatical";
import ActionModel, {Actions} from "../database/models/ActionModel";
import {Data} from "../data";
import {UserInt} from "../database/models/UserModel";

export const autoLate = async (id: ObjectId, data: Data) => {
    const user = await getUserById(id, data);
    user.lates++;
    user.lateTimes.push(moment().unix());
    if (user.lates % 3 == 0) {
        return await punishment(user, data, false, 1, moment().unix());
    } else {
        return await updateUser(user, data);
    }
}

export const punishment = async (user: UserInt, data: Data, acceptFail: boolean, severity: number, now: number): Promise<UserInt> => {
    const banCounter = acceptFail ? user.banCounterFail + severity: user.banCounterAbandon + severity
    switch (banCounter) {
        case 0: {
            user.lastBan = now;
            user.banUntil = now + 30 * 60;
            user.lastReductionAbandon = now;
            user.gamesPlayedSinceReductionAbandon = 0;
            user.lastReductionFail = now;
            user.gamesPlayedSinceReductionFail = 0;
        } break;
        case 1: {
            user.lastBan = now;
            user.banUntil = now + 8 * 60 * 60;
            user.lastReductionAbandon = now;
            user.gamesPlayedSinceReductionAbandon = 0;
            user.lastReductionFail = now;
            user.gamesPlayedSinceReductionFail = 0;
        } break;
        case 2: {
            user.lastBan = now;
            user.banUntil = now + 24 * 60 * 60;
            user.lastReductionAbandon = now;
            user.gamesPlayedSinceReductionAbandon = 0;
            user.lastReductionFail = now;
            user.gamesPlayedSinceReductionFail = 0;
        } break;
        default: {
            user.lastBan = now;
            user.banUntil = now + 2 ** (banCounter - 1) * 12 * 60 * 60;
            user.lastReductionAbandon = now;
            user.gamesPlayedSinceReductionAbandon = 0;
            user.lastReductionFail = now;
            user.gamesPlayedSinceReductionFail = 0;
        } break;
    }
    if (acceptFail) {
        user.banCounterFail += severity + 1;
    } else {
        user.banCounterAbandon += severity + 1;
    }
    return updateUser(user, data);
}

export const abandon = async (userId: ObjectId, discordId: string, guild: Guild, acceptFail: boolean, data: Data) => {
    let user = await getUserById(userId, data);
    const now = moment().unix();
    user = await punishment(user, data, acceptFail, 0, now);
    await ActionModel.create({
        action: acceptFail ? Actions.AcceptFail : Actions.Abandon,
        modId: "1058875839296577586",
        userId: discordId,
        reason: "Auto punishment by bot",
        time: now,
        actionData: `User was punished for ${grammaticalTime(user.banUntil - now)}\nWith a ban counter of ${user.banCounterAbandon} after the punishment`,
    })

    const channel = await guild.channels.fetch(tokens.GeneralChannel) as TextChannel;
    if (acceptFail) {
        await channel.send(`<@${user.id}> has failed to accept a match and been given a cooldown of ${grammaticalTime(user.banUntil - now)}`);
    } else {
        await channel.send(`<@${user.id}> has abandoned a match and been given a cooldown of ${grammaticalTime(user.banUntil - now)}`);
    }

    return;
}
