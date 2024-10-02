import {Document, model, Schema} from "mongoose";

export interface SaveV2ModelInt extends Document {
    id: string;
    queueSND: string;
    gamesSND: string[];
}

export const SaveV2Schema = new Schema({
    id: String,
    queueSND: String,
    gamesSND: [String],
});

export default model<SaveV2ModelInt>('saves-v2', SaveV2Schema);
