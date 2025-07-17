import {GuildMember, PartialGuildMember, User} from "discord.js";
import UserModel from "../../database/models/UserModel";
import {createUser, createBlankUser} from "../constructors/createUser";
import {Types} from "mongoose";
import {Data} from "../../data";

export const getUserByUser = async (user: User | GuildMember | PartialGuildMember, data: Data) => {
    const doc = data.checkCacheByDiscord(user.id);
    if (doc) {
        return doc;
    }
    const docFound = await UserModel.findOne({id: user.id});
    if (docFound) {
        data.cacheUser(docFound);
        return docFound
    }
    return createUser(user);
}

export const getUserById = async (userId: Types.ObjectId, data: Data) => {
    const doc = data.checkCache(String(userId));
    if (doc) {
        return doc;
    }
    const docFound = await UserModel.findOne({_id: userId});
    if (docFound) {
        data.cacheUser(docFound);
        return docFound
    }
    return createBlankUser();
}