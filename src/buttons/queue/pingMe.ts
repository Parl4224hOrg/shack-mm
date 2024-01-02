import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../loggers";
import {pingMe} from "../../modals/pingMe";

export const pingMeButton: Button = {
    data: new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Ping Me")
        .setCustomId("ping-me-button"),
    run: async (interaction) => {
        try {
            await interaction.showModal(pingMe.data);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'ping-me-button',
}