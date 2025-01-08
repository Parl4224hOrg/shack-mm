import {model, Schema, Document} from "mongoose";

export interface MapInt extends Document {
    name: string;
    imageURL: string;
    callouts: string[];
    ugc: string;
    active: boolean;
    modURL: string;
    lastPlayed: number;
}

export const MapSchema = new Schema({
    name: String,
    imageURL: String,
    callouts: [String],
    ugc: String,
    active: Boolean,
    modURL: String,
    lastPlayed: Number,
});

export default model<MapInt>("maps", MapSchema);