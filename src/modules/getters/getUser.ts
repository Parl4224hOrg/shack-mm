import {GuildMember, User} from "discord.js";
import UserModel from "../../database/models/UserModel";
import {createUser, createBlankUser} from "../constructors/createUser";
import {ObjectId} from "mongoose";

export const getUserByUser = async (user: User | GuildMember) => {
    return (
        await UserModel.findOne({id: user.id}))
            ||
        await createUser(user)
}

export const getUserById = async (userId: ObjectId) => {
    return (
        await UserModel.findOne({_id: userId}))
            ||
        await createBlankUser()
}