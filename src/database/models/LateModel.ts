import {model, Schema, Document} from "mongoose";


export interface LateInt extends Document {
    user: string;
    oculusName: string;
    joinTime: number;
    channelGenTime: number;
    matchId: number;
}

export const LateSchema = new Schema({
    user: String,
    oculusName: String,
    joinTime: Number,
    channelGenTime: Number,
    matchId: Number,
});

export default model<LateInt>('lates', LateSchema);
