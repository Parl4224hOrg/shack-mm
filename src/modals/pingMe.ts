import {Modal} from "../interfaces/Modal";
import {
    ActionRowBuilder,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import {logError} from "../loggers";

export const pingMe: Modal = {
    data: new ModalBuilder()
        .setTitle("Ping Me Form")
        .setCustomId("ping-me-form")
        .setComponents([
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('timeInput')
                    .setLabel("<0 for infinite time, 0 to remove, >0 for the specified time in minutes")
                    .setPlaceholder('30')
                    .setMinLength(1)
                    .setMaxLength(4)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            ),
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('numberInput')
                    .setLabel("Number in queue to add ping me for")
                    .setPlaceholder('7')
                    .setMinLength(1)
                    .setMaxLength(1)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            )
        ]),
    run: async (interaction, data) => {
        try {
            const timeStr = interaction.fields.getTextInputValue('timeInput');
            const numberStr = interaction.fields.getTextInputValue('numberInput');
            let time: number;
            let num: number;
            try {
                time = Number(timeStr);
                num = Number(numberStr);
            } catch (e) {
                await interaction.reply({ephemeral: true, content: "Please provide a valid number for both fields"});
                return;
            }
            if (num < 4 || num > 9) {
                await interaction.reply({ephemeral: true, content: "Please enter a number of players between 4 and 9 inclusive"})
                return;
            }
            if (time != null && num != null) {
                await data.addPingMe("SND", "FILL", interaction.user, num, time);
                if (time == 0) {
                    await interaction.reply({ephemeral: true, content: `Removed Ping Me`});
                } else {
                    await interaction.reply({ephemeral: true, content: `Added ping me for ${num} in queue`});
                }
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "ping-me-form",
}