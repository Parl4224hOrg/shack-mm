import { Client } from "discord.js";
import {Data} from "../data";
import {logInfo} from "../loggers";
import {connectDatabase} from "../database/connectDatabase";
import tokens from "../tokens";

export const onReady = async (BOT: Client, data: Data) => {
    await connectDatabase(BOT);
    await data.load();
    await BOT.guilds.cache.get(tokens.GuildID)!.members.fetch();
    await logInfo("Discord _ready!", BOT);
};