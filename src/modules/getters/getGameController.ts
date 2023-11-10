import {GameController} from "../../controllers/GameController";
import GameControllerModel from "../../database/models/GameControllerModel";
import {ObjectId} from "mongoose";

export const getGameController = async (gameController: GameController) => {
    return GameControllerModel.findOne({id: gameController.id});
}

export const getGameControllerById = async (id: ObjectId) => {
    return GameControllerModel.findOne({id: id});
}