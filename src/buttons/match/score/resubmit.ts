import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../../../loggers";
import {winsOrLoss} from "../../../views/submitScoreViews";
import {scoreLimiter} from "../../../utility/limiters";

export const resubmit: Button = {
    data: new ButtonBuilder()
        .setLabel('Resubmit')
        .setCustomId('resubmit')
        .setStyle(ButtonStyle.Secondary),
    run: async (interaction) => {
        try {
            await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: 'Select Win or Loss', components: [winsOrLoss()]})
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'resubmit',
    limiter: scoreLimiter,
}