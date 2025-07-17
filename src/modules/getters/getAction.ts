import ActionModel from "../../database/models/ActionModel";
import {Types} from "mongoose";

export const getAction = async (actionId: Types.ObjectId) => {
    return ActionModel.findOne({_id: actionId});
}

export const getUserActions = async (userId: string) => {
    return ActionModel.find({userId: userId});
}