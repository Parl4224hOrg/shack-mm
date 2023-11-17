import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../../loggers";
import {matchReady} from "../../../utility/match";

export const readyEU15: Button = {
    data: new ButtonBuilder()
        .setLabel('EU-15')
        .setCustomId('snd-_ready-button-EU-15')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','EU', 15);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-_ready-button-EU-15',
}

export const readyEU30: Button = {
    data: new ButtonBuilder()
        .setLabel('EU-30')
        .setCustomId('snd-_ready-button-EU-30')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','EU', 30);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-_ready-button-EU-30',
}

export const readyEU60: Button = {
    data: new ButtonBuilder()
        .setLabel('EU-60')
        .setCustomId('snd-_ready-button-EU-60')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','EU', 60);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-_ready-button-EU-60',
}

export const readyEU120: Button = {
    data: new ButtonBuilder()
        .setLabel('EU-120')
        .setCustomId('snd-_ready-button-EU-120')
        .setStyle(ButtonStyle.Success),
    run: async (interaction, data) => {
        try {
            await matchReady(interaction, data, 'SND','EU', 120);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'snd-_ready-button-EU-120',
}
