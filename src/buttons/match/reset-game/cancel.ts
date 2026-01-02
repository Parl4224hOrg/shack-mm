import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../../loggers";

export const cancelResetGame: Button = {
    data: new ButtonBuilder()
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("cancel_reset_game"),
    run: async (interaction) => {
        try {
            await interaction.update({content: "Game Start Cancelled", components: []})
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "cancel_reset_game",
}