import {model, ObjectId, Schema, Document} from "mongoose";

export interface WarnInt extends Document {
    userId: ObjectId;
    reason: string;
    timeStamp: number;
    modId: string;
    removed: boolean;
}

export const WarnSchema = new Schema( {
    userId: Schema.Types.ObjectId,
    reason: String,
    timeStamp: Number,
    modId: String,
    removed: Boolean,
});

export default model<WarnInt>('warnings', WarnSchema);
