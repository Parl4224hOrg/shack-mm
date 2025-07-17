import GameModel from "../../database/models/GameModel";
import {Types} from "mongoose";
import moment from "moment";
import {ids} from "../../interfaces/Game";

export const createGame = async (id: number, queueId: string, users: Types.ObjectId[], teamA: ids[], teamB: ids[], mmrDiff: number, regionId: string) => {
    const teamAIds: Types.ObjectId[] = [];
    const teamBIds: Types.ObjectId[] = [];

    teamA.forEach(c => teamAIds.push(c.db));
    teamB.forEach(c => teamBIds.push(c.db));

    return (await GameModel.create({
        matchId: id,
        queueId: queueId,
        map: '',
        sides: ['', ''],
        scoreA: -1,
        scoreB: -1,
        users: users,
        teamA: teamAIds,
        teamB: teamBIds,
        creationDate: moment().unix(),
        endDate: -1,
        winner: -1,
        teamAChanges: [],
        teamBChanges: [],
        abandoned: false,
        mmrDiff: mmrDiff,
        region: regionId,
    }));
}