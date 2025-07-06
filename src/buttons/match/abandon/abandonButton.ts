import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../../../loggers";
import {confirmAbandonView} from "../../../views/acceptView";

export const abandonButton: Button = {
    data: new ButtonBuilder()
        .setLabel("Abandon")
        .setStyle(ButtonStyle.Danger)
        .setCustomId('abandon-init'),
    run: async (interaction) => {
        try {
            await interaction.reply({
                flags: MessageFlagsBitField.Flags.Ephemeral,
                content: "Please confirm that you want to abandon",
                components: [confirmAbandonView()],
            })
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'abandon-init',
}