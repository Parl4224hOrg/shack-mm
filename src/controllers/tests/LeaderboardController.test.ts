import {StatsInt} from "../../database/models/StatsModel";
import cacheController from "../CacheController";

test('leaderboardTest', async () => {
    const stats = [{mmr: 124, _id: 'fe'}, {mmr: 355, _id: 'gr'}, {mmr: 495, _id: 'ht'}] as any as StatsInt[];

    for (let stat of stats) {
        cacheController.updateStats(stat);
    }

    const result = await cacheController.getTopTwenty('')

    expect(result[0].mmr).toBe(495);
})