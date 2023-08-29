import {ButtonBuilder} from "@discordjs/builders";
import {ButtonInteraction} from "discord.js";
import {RateLimiter} from "discord.js-rate-limiter";
import {Data} from "../data";

export interface Button {
    data: ButtonBuilder;
    run: (interaction: ButtonInteraction, data: Data) => Promise<void>;
    id: string;
    allowedUsers?: string[];
    allowedRoles?: string[];
    allowedChannels?: string[];
    limiter?: RateLimiter;
}
