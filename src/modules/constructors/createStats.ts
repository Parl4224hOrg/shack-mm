import StatsModel from "../../database/models/StatsModel";
import {ObjectId} from "mongoose";
import tokens from "../../tokens";

export const createStats = async (userId: ObjectId, queueId: string) => {
    return (await StatsModel.create({
        userId: userId,
        queueId: queueId,
        mmr: tokens.StartingMMR,
        mmrHistory: [tokens.StartingMMR],
        gamesPlayed: 0,
        gamesPlayedSinceReset: 0,
        ratingChange: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        gameHistory: [],
        winRate: 0,
    }));
}