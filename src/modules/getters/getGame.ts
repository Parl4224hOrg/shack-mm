import GameModel from "../../database/models/GameModel";
import {ObjectId} from "mongoose";

export const getGameById = async (gameId: ObjectId) => {
    return GameModel.findOne({_id: gameId});
}

export const getGameByMatchId = async (gameId: number) => {
    return GameModel.findOne({matchId: gameId});
}

export const getGames = async () => {
    return GameModel.find({scoreB: {"$gte": 0}, scoreA: {'$gte': 0}});
}

