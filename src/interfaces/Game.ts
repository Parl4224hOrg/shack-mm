import {Types} from "mongoose";
import {Regions} from "../database/models/UserModel";
import {StatsInt} from "../database/models/StatsModel";

export interface ids {
    db: Types.ObjectId;
    discord: string;
    region: Regions
}

export interface QueueUser {
    dbId: Types.ObjectId;
    discordId: string;
    queueExpire: number;
    mmr: number;
    name: string;
    region: Regions;
}

export interface GameUser {
    dbId: Types.ObjectId;
    discordId: string;
    team: number;
    accepted: boolean;
    region: Regions;
    joined: boolean;
    isLate: boolean;
    hasBeenGivenLate: boolean;
}

export interface RecalcUser {
    dbId: Types.ObjectId;
    discordId: string;
    team: number;
    stats: StatsInt
}

export interface Vote {
    total: number;
    id: string;
}
