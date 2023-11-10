import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {matchVotes} from "../../../utility/match";
import {logError} from "../../../loggers";

export const vote1: Button = {
    data: new ButtonBuilder()
        .setLabel('placeholder')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('1'),
    run: async (interaction, data) => {
        try {
            await matchVotes(interaction, data);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: '1'
}

export const vote2: Button = {
    data: new ButtonBuilder()
        .setLabel('placeholder')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('2'),
    run: async (interaction, data) => {
        try {
            await matchVotes(interaction, data);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: '2'
}

export const vote3: Button = {
    data: new ButtonBuilder()
        .setLabel('placeholder')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('3'),
    run: async (interaction, data) => {
        try {
            await matchVotes(interaction, data);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: '3'
}

export const vote4: Button = {
    data: new ButtonBuilder()
        .setLabel('placeholder')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('4'),
    run: async (interaction, data) => {
        try {
            await matchVotes(interaction, data);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: '4'
}

export const vote5: Button = {
    data: new ButtonBuilder()
        .setLabel('placeholder')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('5'),
    run: async (interaction, data) => {
        try {
            await matchVotes(interaction, data);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: '5'
}

export const vote6: Button = {
    data: new ButtonBuilder()
        .setLabel('placeholder')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('6'),
    run: async (interaction, data) => {
        try {
            await matchVotes(interaction, data);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: '6'
}

export const vote7: Button = {
    data: new ButtonBuilder()
        .setLabel('placeholder')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('7'),
    run: async (interaction, data) => {
        try {
            await matchVotes(interaction, data);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: '7'
}
