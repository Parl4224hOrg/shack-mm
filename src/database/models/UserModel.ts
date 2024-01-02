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
    oculusName: string;
    dmMatch: boolean;
    dmQueue: boolean;
    dmAuto: boolean;
    lastReduction: number;
    gamesPlayedSinceReduction: number;
    requeue: boolean;
    frozen: boolean;
    region: Regions;
    games: ObjectId[];
}

export const UserSchema = new Schema({
    id: String,
    name: String,
    stats: [Schema.Types.ObjectId],
    banUntil: Number,
    lastBan: Number,
    banCounter: Number,
    oculusName: String,
    dmMatch: Boolean,
    dmQueue: Boolean,
    dmAuto: Boolean,
    lastReduction: Number,
    gamesPlayedSinceReduction: Number,
    requeue: Boolean,
    frozen: Boolean,
    region: {
        type: String,
        enum: ["NAE", "NAW", "EUE", "EUW", "APAC"]
    },
    games: [Schema.Types.ObjectId]
})

export default model<UserInt>('users', UserSchema)
