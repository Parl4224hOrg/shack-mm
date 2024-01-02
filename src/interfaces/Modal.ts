import {ModalBuilder, ModalSubmitInteraction} from "discord.js";
import {Data} from "../data";
import {RateLimiter} from "discord.js-rate-limiter";

export interface Modal {
    data: ModalBuilder;
    run: (interaction: ModalSubmitInteraction, data: Data) => Promise<void>;
    id: string;
    allowedRoles?: string[];
    allowedUsers?: string[];
    allowedChannels?: string[];
    allowedGuilds?: string[];
    limiter?: RateLimiter;
}