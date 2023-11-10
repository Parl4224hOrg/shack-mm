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
    vote: string[];
}

export interface MapSet {
    '1': string,
    '2': string,
    '3': string,
    '4': string,
    '5': string,
    '6': string,
    '7': string,
}

export interface SideSet {
    '1': string,
    '2': string,
}
