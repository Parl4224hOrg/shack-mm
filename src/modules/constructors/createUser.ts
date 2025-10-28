import {GuildMember, PartialGuildMember, User} from "discord.js";
import UserModel from "../../database/models/UserModel";


export const createUser = async (user: User | GuildMember | PartialGuildMember)=> {
    return (await UserModel.create({
        id: user.id,
        name: !(user instanceof User) ? user.displayName : user.username,
        stats: [],
        banUntil: 0,
        lastBan: 0,
        banCounterFail: 0,
        banCounterAbandon: 0,
        dmMatch: true,
        dmQueue: true,
        dmAuto: true,
        games: [],
        gamesPlayedSinceLates: 0,
        muteUntil: 1,
        canBeFreed: true,
    }));
}

export const createBlankUser = async () => {
    return (await UserModel.create({
        id: "",
        name: "",
        stats: [],
        banUntil: 0,
        lastBan: 0,
        banCounterFail: 0,
        banCounterAbandon: 0,
        dmMatch: true,
        dmQueue: true,
        dmAuto: true,
        games: [],
        gamesPlayedSinceLates: 0,
        muteUntil: 1,
        canBeFreed: true,
    }));
}
