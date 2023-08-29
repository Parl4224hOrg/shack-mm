import {Document, model, ObjectId, Schema} from "mongoose";
import {QueueUser} from "../../interfaces/Game";

export interface QueueControllerInt extends Document {
    queueId: string;
    queueName: string;
    inQueue: QueueUser[]
    activeGames: ObjectId[];
}

export const QueueControllerSchema = new Schema({
    queueId: String,
    queueName: String,
    inQueue: [],
    activeGames: [Schema.Types.ObjectId]
})

export default model<QueueControllerInt>('queue-controllers', QueueControllerSchema)
