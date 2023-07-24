import GameModel from "../../database/models/GameModel";
import {ObjectId} from "mongoose";

export const getGameById = async (gameId: ObjectId) => {
    return GameModel.findOne({_id: gameId});
}