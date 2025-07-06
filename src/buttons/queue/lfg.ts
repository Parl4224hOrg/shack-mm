import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../../loggers";

export const lfg: Button = {
    data: new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setLabel("In Queue")
        .setCustomId('lfg-queue'),
    run: async (interaction, data) => {
        try {
            await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: data.inQueueSND()});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'lfg-queue',
}