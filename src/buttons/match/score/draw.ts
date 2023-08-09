import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../../loggers";
import {matchScore} from "../../../utility/match";

export const draw: Button = {
    data: new ButtonBuilder()
        .setLabel('Draw')
        .setCustomId('match-draw')
        .setStyle(ButtonStyle.Secondary),
    run: async (interaction, data) => {
        try {
            await matchScore(interaction, data, 6);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'match-draw',
}