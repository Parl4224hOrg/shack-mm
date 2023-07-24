import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../../loggers";
import {roundsWon} from "../../../views/submitScoreViews";

export const loss: Button = {
    data: new ButtonBuilder()
        .setLabel('loss')
        .setCustomId('match-loss')
        .setStyle(ButtonStyle.Danger),
    run: async (interaction) => {
        try {
            await interaction.reply({ephemeral: true, content: 'Select how many rounds won', components: roundsWon()})
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'match-loss',
}