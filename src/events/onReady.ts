import { Client } from "discord.js";
import {Data} from "../data";
import {logInfo} from "../loggers";
import {connectDatabase} from "../database/connectDatabase";

export const onReady = async (BOT: Client, data: Data) => {
    await connectDatabase(BOT);
    await data.load();
    await logInfo("Discord ready!", BOT);
};