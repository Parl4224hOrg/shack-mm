import {ObjectId} from "mongoose";

export interface ids {
    db: ObjectId;
    discord: string;
}

export interface QueueUser {
    dbId: ObjectId;
    discordId: string;
    queueExpire: number;
    mmr: number;
    name: string
}

export interface GameUser {
    dbId: ObjectId;
    discordId: string;
    team: number;
    accepted: boolean;
}

export interface Vote {
    total: number;
    id: string;
}

export interface VoteStore {
    id: string;
    vote: string;
}
