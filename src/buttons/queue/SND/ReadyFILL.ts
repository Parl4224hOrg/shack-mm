import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../../loggers";
import {matchReady} from "../../../utility/match";
import {readyLimiter} from "../../../utility/limiters";

export const readyFILL15: Button = {
    data: new ButtonBuilder()
        .setLabel('15')
        .setCustomId('snd-_ready-button-FILL-15')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','FILL', 15);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-_ready-button-FILL-15',
    limiter: readyLimiter,
}

export const readyFILL30: Button = {
    data: new ButtonBuilder()
        .setLabel('30')
        .setCustomId('snd-_ready-button-FILL-30')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','FILL', 30);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-_ready-button-FILL-30',
    limiter: readyLimiter,
}

export const readyFILL60: Button = {
    data: new ButtonBuilder()
        .setLabel('60')
        .setCustomId('snd-_ready-button-FILL-60')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','FILL', 60);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-_ready-button-FILL-60',
    limiter: readyLimiter,
}

export const readyFILL120: Button = {
    data: new ButtonBuilder()
        .setLabel('120')
        .setCustomId('snd-_ready-button-FILL-120')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','FILL', 120);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-_ready-button-FILL-120',
    limiter: readyLimiter,
}
