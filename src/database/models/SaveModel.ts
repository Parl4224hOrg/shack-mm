import {Document, model, Schema} from "mongoose";

export interface SaveModelInt extends Document {
    id: string;
    data: string;
}

export const SaveSchema = new Schema({
    id: String,
    data: String,
});

export default model<SaveModelInt>('saves', SaveSchema);
