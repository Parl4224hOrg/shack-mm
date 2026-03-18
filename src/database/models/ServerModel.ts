import { Document, model, Schema } from "mongoose";
import {Regions} from "./UserModel";


export interface ServerInt extends Document {
    id: string;
    ip: string;
    port: number;
    name: string;
    region: Regions;
    v: number;
    reservedBy?: string;
    reserved: boolean;
}

export const ServerSchema = new Schema({
    id: String,
    ip: String,
    port: Number,
    name: String,
    region: {
        type: String,
        enum: ["NAE", "NAW", "EUE", "EUW", "APAC", "NAC"]
    },
    v: Number,
    reservedBy: { type: String, default: null },
    reserved: Boolean,
});

export default model<ServerInt>('servers', ServerSchema);