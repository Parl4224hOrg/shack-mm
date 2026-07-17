import {GameUser, GameUserWithStats} from "../../interfaces/Game";
import {Types} from "mongoose";
import GameStat from "../../database/models/GameStat";


export const getUserGameStats = async (
    users: GameUser[],
    matchId: Types.ObjectId,
): Promise<GameUserWithStats[]> => {
    const stats = await GameStat.find({
        game: matchId,
    })
        .select("userId kills deaths assists")
        .lean();

    const statsByUserId = new Map(
        stats.map(stat => [stat.userId.toString(), stat]),
    );

    return users.map(user => {
        const stat = statsByUserId.get(user.dbId.toString());

        return {
            ...user,
            kills: stat?.kills ?? 0,
            deaths: stat?.deaths ?? 0,
            assists: stat?.assists ?? 0,
        };
    });
};