import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {matchReady} from "../../../utility/match";
import {logError} from "../../../loggers";

export const readyAPAC15: Button = {
    data: new ButtonBuilder()
        .setLabel('APAC-15')
        .setCustomId('snd-ready-button-APAC-15')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','APAC', 15);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-ready-button-APAC-15',
}

export const readyAPAC30: Button = {
    data: new ButtonBuilder()
        .setLabel('APAC-30')
        .setCustomId('snd-ready-button-APAC-30')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND', 'APAC', 30);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-ready-button-APAC-30',
}

export const readyAPAC60: Button = {
    data: new ButtonBuilder()
        .setLabel('APAC-60')
        .setCustomId('snd-ready-button-APAC-60')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','APAC', 60);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-ready-button-APAC-60',
}

export const readyAPAC120: Button = {
    data: new ButtonBuilder()
        .setLabel('APAC-120')
        .setCustomId('snd-ready-button-APAC-120')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','APAC', 120);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-ready-button-APAC-120',
}