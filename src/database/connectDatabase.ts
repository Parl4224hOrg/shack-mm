import { connect } from "mongoose";
import tokens from '../tokens';
import {Client} from "discord.js";
import {logInfo} from "../loggers";

export const connectDatabase = async (client: Client) => {
    await connect(tokens.DB_URI);
    await logInfo("Database Connected!", client);
};
