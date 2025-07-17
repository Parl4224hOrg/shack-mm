import {Types} from "mongoose";
import {getUserById} from "../modules/getters/getUser";
import moment from "moment/moment";
import {Guild, TextChannel} from "discord.js";
import tokens from "../tokens";
import {updateUser} from "../modules/updaters/updateUser";
import {grammaticalTime} from "./grammatical";
import ActionModel, {Actions} from "../database/models/ActionModel";
import {Data} from "../data";
import {UserInt} from "../database/models/UserModel";
import {wasUserInPreviousGeneratedGame} from "../modules/getters/getGame";
import {logInfo} from "../loggers";

export const autoLate = async (id: Types.ObjectId, data: Data) => {
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
    const banCounter = acceptFail ? user.banCounterFail : user.banCounterAbandon
    const adjustedBanCounter = banCounter + severity - 1; // Adjust the ban counter based on severity

    user.lastBan = now;
    user.lastReductionAbandon = now;
    user.gamesPlayedSinceReductionAbandon = 0;
    user.lastReductionFail = now;
    user.gamesPlayedSinceReductionFail = 0;

    const DAY = 24 * 60 * 60; // Number of seconds in a day
    
    switch (adjustedBanCounter) {
        case 0:
            user.banUntil = now + 30 * 60;
            break;
        case 1:
            user.banUntil = now + 8 * 60 * 60;
            break;
        case 2:
            user.banUntil = now + DAY;
            break;
        case 3:
            user.banUntil = now + DAY * 2;
            break;
        case 4:
            user.banUntil = now + DAY * 4;
            break;
        case 5:
            user.banUntil = now + DAY * 8;
            break;
        case 6:
            user.banUntil = now + DAY * 16;
            break;
        case 7:
            user.banUntil = now + DAY * 32;
            break;
        case 8:
            user.banUntil = now + DAY * 64;
            break;
        case 9:
            user.banUntil = now + DAY * 128;
            break;
        case 10:
            user.banUntil = now + DAY * 256;
            break;
        default:
            user.banUntil = now + DAY * 512;
            break;
    }
    if (acceptFail) {
        user.banCounterFail += severity;
    } else {
        user.banCounterAbandon += severity;
    }
    return updateUser(user, data);
}

export const abandon = async (userId: Types.ObjectId, discordId: string, guild: Guild, acceptFail: boolean, data: Data, currentMatchId?: number) => {
    let user = await getUserById(userId, data);
    const now = moment().unix();
    
    // Check if user was in the previous generated game and if that game was abandoned
    if (acceptFail) {
        const { wasInGame, game } = await wasUserInPreviousGeneratedGame(userId, guild.client);
        if (wasInGame && game && game.abandoned) {
            await logInfo(`abandon() - User ${user.id} failed to accept match but was in abandoned game. Failed match: ${currentMatchId || 'unknown'}, Abandoned match: ${game.matchId}`, guild.client);
            const channel = await guild.channels.fetch(tokens.GeneralChannel) as TextChannel;
            await channel.send(`<@${user.id}> was a victim of autorequeue from an abandoned game, skipping fail-to-accept punishment.`);
            return;
        }
    }
    
    user = await punishment(user, data, acceptFail, 1, now);
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

export const getCheckBanMessage = async (user: UserInt, data: Data) => {
    const time = moment().unix();
    let message;
    if (moment().unix() > user.banUntil) {
        message = `<@${user.id}>\nNo current cooldown, Last cooldown was <t:${user.lastBan}:R>\nBan Counter for Abandon: ${user.banCounterAbandon}\n`;
        message += `Ban Counter for fail to accept: ${user.banCounterFail}`;
    } else {
        message = `<@${user.id}>\nCooldown ends <t:${user.banUntil}:R>\nBan Counter for Abandon: ${user.banCounterAbandon}\n`;
        message += `Ban Counter for fail to accept: ${user.banCounterFail}`;
    }
    message += `\nConsecutive games for Abandons: ${user.gamesPlayedSinceReductionAbandon}, Next reduction by time: <t:${user.lastReductionAbandon + 1209600}:F>`
    message += `\nConsecutive games for Fail to Accept: ${user.gamesPlayedSinceReductionFail}, Next reduction by time: <t:${user.lastReductionFail + 1209600}:F>`
    if (user.frozen == null) {
        user.frozen = false;
        await updateUser(user, data);
    }
    if (user.frozen) {
        message += "\nYou are frozen from queueing due to a pending ticket";
    }
    message += `\nRegistered Name: ${user.oculusName}\n`
    if (user.muteUntil < 0) {
        message += "You are muted indefinitely";
    } else if (time > user.muteUntil) {
        message += "You are not muted";
    } else {
        message += `You are muted until <t:${user.muteUntil}:R>`;
    }
    return message
}
