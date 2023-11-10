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

export const score6: Button = {
    data: new ButtonBuilder()
        .setLabel('6')
        .setCustomId('score-submit-6')
        .setStyle(ButtonStyle.Danger),
    run: async (interaction, data) => {
        try {
            await matchScore(interaction, data, 6);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'score-submit-6',
}

export const score7: Button = {
    data: new ButtonBuilder()
        .setLabel('7')
        .setCustomId('score-submit-7')
        .setStyle(ButtonStyle.Danger),
    run: async (interaction, data) => {
        try {
            await matchScore(interaction, data, 7);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'score-submit-7',
}

export const score8: Button = {
    data: new ButtonBuilder()
        .setLabel('8')
        .setCustomId('score-submit-8')
        .setStyle(ButtonStyle.Danger),
    run: async (interaction, data) => {
        try {
            await matchScore(interaction, data, 8);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'score-submit-8',
}

export const score9: Button = {
    data: new ButtonBuilder()
        .setLabel('9')
        .setCustomId('score-submit-9')
        .setStyle(ButtonStyle.Danger),
    run: async (interaction, data) => {
        try {
            await matchScore(interaction, data, 9);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'score-submit-9',
}


