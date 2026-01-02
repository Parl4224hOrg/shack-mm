import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ActionRowBuilder, ButtonStyle, MessageActionRowComponentBuilder, MessageFlagsBitField} from "discord.js";
import {confirmSwitchMap} from "./confirm";
import {cancelSwitchMap} from "./cancel";
import {logError} from "../../../loggers";

export const promptSwitchMap: Button = {
    data: new ButtonBuilder()
        .setCustomId("prompt_switch_map")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Switch Map"),
    run: async (interaction) => {
        try {
            await interaction.reply({
                content: "Are you sure you want to switch the map?",
                flags: MessageFlagsBitField.Flags.Ephemeral,
                components: [new ActionRowBuilder<MessageActionRowComponentBuilder>()
                    .addComponents(confirmSwitchMap.data, cancelSwitchMap.data).toJSON()],
            })
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "prompt_switch_map",
}