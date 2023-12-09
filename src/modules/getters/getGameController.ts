import GameControllerModel from "../../database/models/GameControllerModel";
import {ObjectId} from "mongoose";

export const getGameControllerById = async (id: ObjectId) => {
    return GameControllerModel.findOne({id: id});
}