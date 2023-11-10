import {GuildMember, User} from "discord.js";
import UserModel from "../../database/models/UserModel";


export const createUser = async (user: User | GuildMember)=> {
    return (await UserModel.create({
        id: user.id,
        name: !(user instanceof User) ? user.displayName : user.username,
        stats: [],
        banUntil: 0,
        lastBan: 0,
        banCounter: 0,
        dmMatch: true,
        dmQueue: true,
        dmAuto: true,
        games: [],
    }));
}

export const createBlankUser = async () => {
    console.log("here2")
    return (await UserModel.create({
        id: "",
        name: "",
        stats: [],
        banUntil: 0,
        lastBan: 0,
        banCounter: 0,
        dmMatch: true,
        dmQueue: true,
        dmAuto: true,
        games: [],
    }));
}
