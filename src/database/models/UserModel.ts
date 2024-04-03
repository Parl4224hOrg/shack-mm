import {Document, model, ObjectId, Schema} from "mongoose";


export enum Regions {
    NAE = "NAE",
    NAW = "NAW",
    EUE = "EUE",
    EUW = "EUW",
    APAC = "APAC",
}

export interface UserInt extends Document {
    id: string
    name: string;
    stats: ObjectId[];
    banUntil: number;
    lastBan: number;
    banCounter: number;
    banCounterAbandon: number;
    banCounterFail: number;
    oculusName: string;
    dmMatch: boolean;
    dmQueue: boolean;
    dmAuto: boolean;
    lastReduction: number;
    gamesPlayedSinceReduction: number;
    lastReductionAbandon: number;
    gamesPlayedSinceReductionAbandon: number;
    lastReductionFail: number;
    gamesPlayedSinceReductionFail: number;
    requeue: boolean;
    frozen: boolean;
    region: Regions;
    games: ObjectId[];
    muteUntil: number;
}

export const UserSchema = new Schema({
    id: String,
    name: String,
    stats: [Schema.Types.ObjectId],
    banUntil: Number,
    lastBan: Number,
    banCounter: Number,
    banCounterAbandon: Number,
    banCounterFail: Number,
    oculusName: String,
    dmMatch: Boolean,
    dmQueue: Boolean,
    dmAuto: Boolean,
    lastReduction: Number,
    gamesPlayedSinceReduction: Number,
    lastReductionAbandon: Number,
    gamesPlayedSinceReductionAbandon: Number,
    lastReductionFail: Number,
    gamesPlayedSinceReductionFail: Number,
    requeue: Boolean,
    frozen: Boolean,
    region: {
        type: String,
        enum: ["NAE", "NAW", "EUE", "EUW", "APAC"]
    },
    games: [Schema.Types.ObjectId],
    muteUntil: Number,
})

export default model<UserInt>('users', UserSchema)
