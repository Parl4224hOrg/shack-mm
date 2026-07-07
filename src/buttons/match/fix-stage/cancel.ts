import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../../loggers";

export const cancelFixStage: Button = {
    data: new ButtonBuilder()
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("cancel_fix_stage"),
    run: async (interaction) => {
        try {
            await interaction.update({content: "Fix Stage Cancelled", components: []})
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "cancel_fix_stage",
}