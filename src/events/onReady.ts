import { Client } from "discord.js";
import {Data} from "../data";
import {logInfo} from "../loggers";
import {connectDatabase} from "../database/connectDatabase";
import tokens from "../tokens";

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export const onReady = async (BOT: Client, data: Data) => {
    await connectDatabase(BOT);
    await data.load();
    await delay(3000);
    await BOT.guilds.cache.get(tokens.GuildID)!.members.fetch();
    data.setLoaded(true);
    await logInfo("Discord ready!", BOT);
};