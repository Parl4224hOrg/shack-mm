import {Document, model, Schema, Types} from "mongoose";

export interface StatsInt extends Document {
    userId: Types.ObjectId;
    queueId: string;
    mmr: number;
    mmrHistory: number[];
    gamesPlayed: number;
    gamesPlayedSinceReset: number;
    ratingChange: number;
    wins: number;
    losses: number;
    draws: number;
    gameHistory: string[];
    winRate: number;
    rank: number;
}

export const StatsSchema = new Schema({
    userId: Schema.Types.ObjectId,
    queueId: String,
    mmr: Number,
    mmrHistory: [Number],
    gamesPlayed: Number,
    gamesPlayedSinceReset: Number,
    ratingChange: Number,
    wins: Number,
    losses: Number,
    draws: Number,
    gameHistory: [String],
    winRate: Number,
    rank: Number,
});

export default model<StatsInt>('stats', StatsSchema);
