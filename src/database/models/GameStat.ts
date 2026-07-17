import { Document, model, Schema, Types } from "mongoose";

export interface GameStatInt extends Document {
    userId: Types.ObjectId;
    queueId: string;
    game: Types.ObjectId;
    uniqueId: string;
    kills: number;
    headshots: number;
    assists: number;
    teamKills: number;
    bombPlants: number;
    deaths: number;
    exp: number;
    team: number;
    kst?: number;
}

export const GameStatSchema = new Schema<GameStatInt>({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    queueId: {
        type: String,
        required: true,
    },
    game: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    uniqueId: {
        type: String,
        required: true,
    },
    kills: {
        type: Number,
        required: true,
    },
    headshots: {
        type: Number,
        required: true,
    },
    assists: {
        type: Number,
        required: true,
    },
    teamKills: {
        type: Number,
        required: true,
    },
    bombPlants: {
        type: Number,
        required: true,
    },
    deaths: {
        type: Number,
        required: true,
    },
    exp: {
        type: Number,
        required: true,
    },
    team: {
        type: Number,
        required: true,
    },
    kst: {
        type: Number,
        required: false,
    },
});

export default model<GameStatInt>("gameStats", GameStatSchema);