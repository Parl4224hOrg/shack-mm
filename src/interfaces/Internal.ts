import {ObjectId} from "mongoose";

export interface InternalResponse {
    success: boolean;
    message: string;
    next?: boolean;
    data?: any;
}

export interface QueueData {
    queueName: string;
    inQueue: string[];
    games: GameData[];
}

export interface GameData {
    id: ObjectId;
    matchNumber: number;
    tickCount: number;
    state: number;
    users: string[];
    map: string;
    sides: string[];
    score: number[];
}
