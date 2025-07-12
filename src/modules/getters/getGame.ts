import GameModel from "../../database/models/GameModel";
import {ObjectId} from "mongoose";
import {Client} from "discord.js";
import {logInfo} from "../../loggers";

export const getGameById = async (gameId: ObjectId) => {
    return GameModel.findOne({_id: gameId});
}

export const getGameByMatchId = async (gameId: number) => {
    return GameModel.findOne({matchId: gameId});
}

export const getGames = async (rangeStart: number = 0) => {
    return GameModel.find({scoreB: {"$gte": 0}, scoreA: {'$gte': 0}, matchId: {"$gte": rangeStart}});
}

export const getPreviousGeneratedGame = async (client?: Client) => {
    const previousGame = await GameModel.find().sort({creationDate: -1}).limit(2).then((games: any[]) => games[1] || null);
    if (client) {
        await logInfo(`getPreviousGeneratedGame - Found game: ${previousGame ? `Match ID: ${previousGame.matchId}, Abandoned: ${previousGame.abandoned}` : 'No previous game found'}`, client);
    }
    return previousGame;
}

export const wasUserInPreviousGeneratedGame = async (userId: ObjectId, client?: Client) => {
    const previousGame = await getPreviousGeneratedGame(client);
    if (!previousGame) {
        if (client) {
            await logInfo(`wasUserInPreviousGeneratedGame - User ${userId}: No previous game found, returning false`, client);
        }
        return { wasInGame: false, game: null };
    }
    
    const wasInGame = previousGame.users.some((user: ObjectId) => user.toString() === userId.toString());
    if (client) {
        await logInfo(`wasUserInPreviousGeneratedGame - User ${userId}: Match ID ${previousGame.matchId}, Abandoned: ${previousGame.abandoned}, Was in game: ${wasInGame}`, client);
    }
    return { wasInGame, game: previousGame };
}

