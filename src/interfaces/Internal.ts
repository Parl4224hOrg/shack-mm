import {Types} from "mongoose";

export interface PingMeUser {
    id: string;
    inQueue: number;
    expires: number;
    pinged: boolean;
}

export interface MapData {
    mapName: string;
    lastGame: number;
}

export interface InternalResponse {
    success: boolean;
    message: string;
    flags?: number;
    next?: boolean;
    data?: any;
}

export interface QueueData {
    queueName: string;
    inQueue: string[];
    games: GameData[];
}

export interface GameData {
    id: Types.ObjectId;
    matchNumber: number;
    tickCount: number;
    state: number;
    users: string[];
    map: string;
    sides: string[];
    score: number[];
}

export interface Rank {
    name: string;
    threshold: number;
    roleId: string;
}

export interface CommandPermission {
    valid: boolean;
    limited: boolean;
    channel: boolean
    guild: boolean;
}
