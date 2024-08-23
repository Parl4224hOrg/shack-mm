import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../../loggers";

export const abandonDeny: Button = {
    data: new ButtonBuilder()
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Primary)
        .setCustomId('abandon-deny'),
    run: async (interaction) => {
        try {
            const parent = interaction.message;
            await parent.edit({content: "Abandon Cancelled", components: []});
            await interaction.reply({ephemeral: true, content: "You have cancelled your abandon"})
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'abandon-deny',
}