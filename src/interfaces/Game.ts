import {ObjectId} from "mongoose";
import {Regions} from "../database/models/UserModel";

export interface ids {
    db: ObjectId;
    discord: string;
    region: Regions
}

export interface QueueUser {
    dbId: ObjectId;
    discordId: string;
    queueExpire: number;
    mmr: number;
    name: string;
    region: Regions;
}

export interface GameUser {
    dbId: ObjectId;
    discordId: string;
    team: number;
    accepted: boolean;
    region: Regions;
}

export interface Vote {
    total: number;
    id: string;
}
