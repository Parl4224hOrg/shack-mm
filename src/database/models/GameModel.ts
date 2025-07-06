import {Document, model, ObjectId, Schema} from "mongoose";

export interface GameInt extends Document {
    _id: ObjectId;
    matchId: number;
    queueId: string;
    map: string;
    sides: string[];
    scoreA: number;
    scoreB: number;
    users: ObjectId[];
    teamA: ObjectId[];
    teamB: ObjectId[];
    creationDate: number;
    endDate: number;
    winner: number;
    teamAChanges: number[];
    teamBChanges: number[];
    abandoned: boolean;
    nullified: boolean;
    mmrDiff: number;
    region: string;
}

export const GameSchema = new Schema({
    matchId: Number,
    queueId: String,
    map: String,
    sides: [String],
    scoreA: Number,
    scoreB: Number,
    users: [Schema.Types.ObjectId],
    teamA: [Schema.Types.ObjectId],
    teamB: [Schema.Types.ObjectId],
    creationDate: Number,
    endDate: Number,
    winner: Number,
    teamAChanges: [Number],
    teamBChanges: [Number],
    abandoned: Boolean,
    nullified: Boolean,
    mmrDiff: Number,
    region: String,
});

export default model<GameInt>('games', GameSchema)
