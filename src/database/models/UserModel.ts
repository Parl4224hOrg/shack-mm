import {Document, model, ObjectId, Schema} from "mongoose";

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
    games: [Schema.Types.ObjectId]
})

export default model<UserInt>('users', UserSchema)
