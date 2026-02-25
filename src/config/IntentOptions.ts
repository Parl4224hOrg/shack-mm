import {GatewayIntentBits, Partials} from "discord.js";

export const IntentOptions = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
]

export const PartialsOptions = [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
]