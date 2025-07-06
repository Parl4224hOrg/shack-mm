import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../../../loggers";
import {roundsWon} from "../../../views/submitScoreViews";
import {scoreLimiter} from "../../../utility/limiters";

export const loss: Button = {
    data: new ButtonBuilder()
        .setLabel('Loss')
        .setCustomId('match-loss')
        .setStyle(ButtonStyle.Danger),
    run: async (interaction) => {
        try {
            await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: 'Select how many rounds won', components: roundsWon()})
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'match-loss',
    limiter: scoreLimiter,
}