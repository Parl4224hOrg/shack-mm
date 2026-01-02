import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ActionRowBuilder, ButtonStyle, MessageActionRowComponentBuilder, MessageFlagsBitField} from "discord.js";
import {confirmResetGame} from "./confirm";
import {cancelResetGame} from "./cancel";
import {logError} from "../../../loggers";

export const promptResetGame: Button = {
    data: new ButtonBuilder()
        .setCustomId("prompt_reset_game")
        .setStyle(ButtonStyle.Primary)
        .setLabel("Start Game"),
    run: async (interaction) => {
        try {
            await interaction.reply({
                content: "Are you sure you want to start the game?",
                flags: MessageFlagsBitField.Flags.Ephemeral,
                components: [new ActionRowBuilder<MessageActionRowComponentBuilder>()
                    .addComponents(confirmResetGame.data, cancelResetGame.data).toJSON()],
            })
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "prompt_reset_game",
}