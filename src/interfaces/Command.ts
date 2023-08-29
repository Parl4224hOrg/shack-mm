import {
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from "@discordjs/builders";
import {ChatInputCommandInteraction, SlashCommandSubcommandBuilder} from "discord.js";
import {Data} from "../data";
import {RateLimiter} from "discord.js-rate-limiter";

export interface Command {
    data:
        | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">
        | SlashCommandSubcommandsOnlyBuilder;
    run: (interaction: ChatInputCommandInteraction, data: Data) => Promise<void>;
    name: string;
    allowedRoles?: string[];
    allowedUsers?: string[];
    allowedChannels?: string[];
    limiter?: RateLimiter;
}

export interface SubCommand {
    data: SlashCommandSubcommandBuilder,
    run: (interaction: ChatInputCommandInteraction, data: Data) => Promise<void>;
    name: string;
    allowedRoles?: string[];
    allowedUsers?: string[];
    allowedChannels?: string[];
    limiter?: RateLimiter;
}
