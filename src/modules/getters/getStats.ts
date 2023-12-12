import {ObjectId} from "mongoose";
import StatsModel, {StatsInt} from "../../database/models/StatsModel";
import {createStats} from "../constructors/createStats";

export const getStats = async (userId: ObjectId, queueId: string): Promise<StatsInt> => {
    return (
        await StatsModel.findOne({userId: userId, queueId: queueId})
            ||
        await createStats(userId, queueId)
    );
}

export const getTopTwenty = async (queueId: string) => {
    return StatsModel.find({queueId: queueId, gamesPlayed: {'$gte': 10}}).sort({mmr: -1}).limit(20);
}