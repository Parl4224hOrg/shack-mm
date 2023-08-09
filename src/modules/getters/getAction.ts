import {ObjectId} from "mongoose";
import ActionModel from "../../database/models/ActionModel";

export const getAction = async (actionId: ObjectId) => {
    return ActionModel.findOne({_id: actionId});
}

export const getModActions = async (modId: string) => {
    return ActionModel.find({modId: modId});
}

export const getUserActions = async (userId: string) => {
    return ActionModel.find({userId: userId});
}