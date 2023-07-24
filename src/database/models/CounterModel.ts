import { Document, model, Schema } from "mongoose";

export interface CounterInt extends Document {
    _id: string
    value: number;
}

export const CounterSchema = new Schema({
    _id: String,
    value: Number,
});

export default model<CounterInt>("counters", CounterSchema);
