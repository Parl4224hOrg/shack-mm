import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../../loggers";
import {matchScore} from "../../../utility/match";

export const score0: Button = {
    data: new ButtonBuilder()
        .setLabel('0')
        .setCustomId('score-submit-0')
        .setStyle(ButtonStyle.Danger),
    run: async (interaction, data) => {
        try {
            await matchScore(interaction, data, 0);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'score-submit-0',
}

export const score1: Button = {
    data: new ButtonBuilder()
        .setLabel('1')
        .setCustomId('score-submit-1')
        .setStyle(ButtonStyle.Danger),
    run: async (interaction, data) => {
        try {
            await matchScore(interaction, data, 1);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'score-submit-1',
}

export const score2: Button = {
    data: new ButtonBuilder()
        .setLabel('2')
        .setCustomId('score-submit-2')
        .setStyle(ButtonStyle.Danger),
    run: async (interaction, data) => {
        try {
            await matchScore(interaction, data, 2);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'score-submit-2',
}

export const score3: Button = {
    data: new ButtonBuilder()
        .setLabel('3')
        .setCustomId('score-submit-3')
        .setStyle(ButtonStyle.Danger),
    run: async (interaction, data) => {
        try {
            await matchScore(interaction, data, 3);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'score-submit-3',
}

export const score4: Button = {
    data: new ButtonBuilder()
        .setLabel('4')
        .setCustomId('score-submit-4')
        .setStyle(ButtonStyle.Danger),
    run: async (interaction, data) => {
        try {
            await matchScore(interaction, data, 4);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'score-submit-4',
}

export const score5: Button = {
    data: new ButtonBuilder()
        .setLabel('5')
        .setCustomId('score-submit-5')
        .setStyle(ButtonStyle.Danger),
    run: async (interaction, data) => {
        try {
            await matchScore(interaction, data, 5);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'score-submit-5',
}


