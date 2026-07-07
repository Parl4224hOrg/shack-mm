import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ActionRowBuilder, ButtonStyle, MessageActionRowComponentBuilder, MessageFlagsBitField} from "discord.js";
import {confirmFixStage} from "./confirm";
import {cancelFixStage} from "./cancel";
import {logError} from "../../../loggers";

export const promptFixStage: Button = {
    data: new ButtonBuilder()
        .setCustomId("prompt_fix_stage")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Fix Stage"),
    run: async (interaction) => {
        try {
            await interaction.reply({
                content: "Are you sure you want to fix your team's stage?",
                flags: MessageFlagsBitField.Flags.Ephemeral,
                components: [new ActionRowBuilder<MessageActionRowComponentBuilder>()
                    .addComponents(confirmFixStage.data, cancelFixStage.data).toJSON()],
            })
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "prompt_fix_stage",
}