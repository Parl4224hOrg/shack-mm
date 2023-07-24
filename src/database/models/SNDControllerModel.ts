import {Document, model, Schema} from "mongoose";

export interface SNDControllerInt extends Document {

}

export const SNDControllerSchema = new Schema({

})

export default model<SNDControllerInt>('sndcontroller', SNDControllerSchema)
