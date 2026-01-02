import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../../loggers";

export const cancelSwitchMap: Button = {
    data: new ButtonBuilder()
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("cancel_switch_map"),
    run: async (interaction) => {
        try {
            await interaction.update({content: "Switch Map Cancelled", components: []})
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "cancel_switch_map",
}