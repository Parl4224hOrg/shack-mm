import {Document, model, ObjectId, Schema} from "mongoose";
import {GameUser, MapSet, SideSet, VoteStore} from "../../interfaces/Game";


export interface GameControllerInt extends Document {
    id: ObjectId;
    matchNumber: number;
    tickCount: number;
    state: number;
    users: GameUser[];
    queueId: string;
    scoreLimit: number;
    acceptChannelGen: boolean;
    acceptChannelId: string;
    matchRoleId: string;
    acceptCountdown: number;
    voteChannelsGen: boolean;
    teamAChannelId: string;
    teamARoleId: string;
    teamBChannelId: string;
    teamBRoleId: string;
    voteA1MessageId: string;
    voteB1MessageId: string;
    voteA2MessageId: string;
    voteB2MessageId: string;
    voteCountdown: number;
    votes: VoteStore[];
    mapSet: MapSet;
    sideSide: SideSet;
    currentMaxVotes: number;
    map: string;
    sides: string[];
    finalChannelGen: boolean;
    finalChannelId: string;
    scores: number[];
    scoresAccept: boolean[];
    scoresConfirmMessageSent: boolean;
    processed: boolean;
    abandoned: boolean;
    abandonCountdown: number;
    cleanedUp: boolean;
}

export const GameControllerSchema = new Schema({
    id: Schema.Types.ObjectId,
    matchNumber: Number,
    tickCount: Number,
    state: Number,
    users: [],
    queueId: String,
    scoreLimit: Number,
    acceptChannelGen: Boolean,
    acceptChannelId: String,
    matchRoleId: String,
    acceptCountdown: Number,
    voteChannelsGen: Boolean,
    teamAChannelId: String,
    teamARoleId: String,
    teamBChannelId:String,
    teamBRoleId:String,
    voteA1MessageId: String,
    voteB1MessageId: String,
    voteA2MessageId: String,
    voteB2MessageId: String,
    voteCountdown: Number,
    votes: [],
    mapSet: {
        '1': String,
        '2': String,
        '3': String,
        '4': String,
        '5': String,
        '6': String,
        '7': String,
    },
    sideSet: {
        '1': String,
        '2': String,
    },
    currentMaxVotes: Number,
    map: String,
    sides: [String],
    finalChannelGen: Boolean,
    finalChannelId: String,
    scores: [Number],
    scoresAccept: [Boolean],
    scoresConfirmMessageSent: Boolean,
    processed: Boolean,
    abandoned: Boolean,
    abandonCountdown: Number,
    cleanedUp: Boolean,
})

export default model<GameControllerInt>('game-controllers', GameControllerSchema)
