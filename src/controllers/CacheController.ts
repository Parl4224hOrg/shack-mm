import {UserInt} from "../database/models/UserModel";
import {StatsInt} from "../database/models/StatsModel";
import {Collection} from "discord.js";
import {ObjectId} from "mongoose";
import {getUserById} from "../modules/getters/getUser";
import {getStats} from "../modules/getters/getStats";

class CacheController {
    private users: Collection<ObjectId, UserInt> = new Collection<ObjectId, UserInt>();
    private stats: Collection<ObjectId, StatsInt> = new Collection<ObjectId, StatsInt>();

    async getUser(id: ObjectId): Promise<UserInt> {
        let user = this.users.get(id);
        if (user) {
            return user;
        }
        return getUserById(id);
    }

    async getStats(id: ObjectId, queueId: string): Promise<StatsInt> {
        let stats = this.stats.get(id);
        if (stats) {
            return stats;
        }
        return getStats(id, queueId);
    }

    async getTopTwenty(queueId: string): Promise<StatsInt[]> {
        const stats = Array.from(this.stats.values()).sort((a, b) => {return b.mmr - a.mmr});
        return stats.slice(0, 20);
    }

    updateUser(user: UserInt) {
        this.users.set(user._id, user);
        return user;
    }

    updateStats(stats: StatsInt) {
        this.stats.set(stats._id, stats);
        return stats;
    }
}

export default new CacheController();
