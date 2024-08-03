import {ObjectId} from "mongoose";
import {Regions} from "../database/models/UserModel";
import {StatsInt} from "../database/models/StatsModel";

export interface ids {
    db: ObjectId;
    discord: string;
    region: Regions
}

export interface QueueUser {
    dbId: ObjectId;
    discordId: string;
    queueExpire: number;
    whenQueuedUp: number;
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
    joined: boolean;
}

export interface RecalcUser {
    dbId: ObjectId;
    discordId: string;
    team: number;
    stats: StatsInt
}

export interface Vote {
    total: number;
    id: string;
}
