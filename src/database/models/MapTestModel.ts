import { Document, model, Schema } from "mongoose";

export interface MapTestInt extends Document {
    id: string;
    players: string[];
    time: number;
    description: string;
    owner: string;
    map: string;
    messageId: string;
    pinged: boolean;
    deleted: boolean;
}

export const MapTestSchema = new Schema({
    id: String,
    players: [String],
    time: Number,
    description: String,
    owner: String,
    map: String,
    messageId: String,
    pinged: Boolean,
    deleted: Boolean,
});

export default model<MapTestInt>("mapTests", MapTestSchema);
