import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../../loggers";
import {matchReady} from "../../../utility/match";

export const readyNA15: Button = {
    data: new ButtonBuilder()
        .setLabel('NA-15')
        .setCustomId('snd-ready-button-NA-15')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','NA', 15);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-ready-button-NA-15',
}

export const readyNA30: Button = {
    data: new ButtonBuilder()
        .setLabel('NA-30')
        .setCustomId('snd-ready-button-NA-30')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','NA', 30);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-ready-button-NA-30',
}

export const readyNA60: Button = {
    data: new ButtonBuilder()
        .setLabel('NA-60')
        .setCustomId('snd-ready-button-NA-60')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','NA', 60);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-ready-button-NA-60',
}

export const readyNA120: Button = {
    data: new ButtonBuilder()
        .setLabel('NA-120')
        .setCustomId('snd-ready-button-NA-120')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','NA', 120);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-ready-button-NA-120',
}
