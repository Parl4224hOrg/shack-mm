import {StringSelectMenuBuilder, StringSelectMenuInteraction} from "discord.js";
import {Data} from "../data";
import {RateLimiter} from "discord.js-rate-limiter";

export interface StringSelectMenu {
    data: StringSelectMenuBuilder;
    run: (interaction: StringSelectMenuInteraction, data: Data) => Promise<void>;
    id: string;
    allowedUsers?: string[];
    allowedRoles?: string[];
    allowedChannels?: string[];
    limiter?: RateLimiter;
}