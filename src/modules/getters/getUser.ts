import {GuildMember, User} from "discord.js";
import UserModel from "../../database/models/UserModel";
import {createUser, createBlankUser} from "../constructors/createUser";
import {ObjectId} from "mongoose";
import {Data} from "../../data";

export const getUserByUser = async (user: User | GuildMember, data: Data) => {
    const doc = data.checkCacheByDiscord(user.id);
    if (doc) {
        return doc;
    }
    return (
        await UserModel.findOne({id: user.id}))
            ||
        await createUser(user)
}

export const getUserById = async (userId: ObjectId, data: Data) => {
    const doc = data.checkCache(String(userId));
    if (doc) {
        return doc;
    }
    return (
        await UserModel.findOne({_id: userId})) || createBlankUser()
}