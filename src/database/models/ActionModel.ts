import {model, Schema, Document} from "mongoose";

export enum Actions {
    Cooldown = 'cd',
    ForceScore = 'fs',
    Nullify = 'nu',
    ReverseCooldown = 'rcd',
}

export interface ActionInt extends Document {
    action: Actions;
    modId: string;
    userId?: string;
    reason: string;
    time: number;
    actionData: string;
}

export const ActionSchema = new Schema({
    action: {
        type: String,
        enum: ['cd', 'fs', 'nu', 'rcd', 'sr'],
        default: 'cd',
    },
    modId: String,
    userId: String,
    reason: String,
    time: Number,
    actionData: String,
});

export default model<ActionInt>('actions', ActionSchema);
