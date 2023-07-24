import {ObjectId} from "mongoose";
import StatsModel from "../../database/models/StatsModel";
import {createStats} from "../constructors/createStats";

export const getStats = async (userId: ObjectId, queueId: string) => {
    return (
        await StatsModel.findOne({userId: userId, queueId: queueId})
            ||
        await createStats(userId, queueId)
    );
}