import StatsModel, {StatsInt} from "../../database/models/StatsModel";

export const updateStats = async (stats: StatsInt) => {
    const filter = {_id: stats._id};
    return StatsModel.findOneAndUpdate(filter, stats, {new: true, upsert: true});
}