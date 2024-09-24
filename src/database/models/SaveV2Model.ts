import {Document, model, Schema} from "mongoose";

export interface SaveV2ModelInt extends Document {
    id: string;
    data: string;
}

export const SaveV2Schema = new Schema({
    id: String,
    data: String,
});

export default model<SaveV2ModelInt>('saves-v2', SaveV2Schema);
