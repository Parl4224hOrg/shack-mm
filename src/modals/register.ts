import {Modal} from "../interfaces/Modal";
import {
    ActionRowBuilder, MessageFlagsBitField,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import {logError} from "../loggers";
import {handleRegister} from "../utility/register";

export const register: Modal = {
    data: new ModalBuilder()
        .setTitle("Register")
        .setCustomId("register-form")
        .setComponents([
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('name')
                    .setLabel("Oculus Name (case-sensitive)")
                    .setPlaceholder('pavlovPlayer')
                    .setMinLength(1)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            )
        ]),
    run: async (interaction, data) => {
        try {
            await interaction.deferReply({flags: MessageFlagsBitField.Flags.Ephemeral});
            const res = await handleRegister(
                interaction.fields.getTextInputValue('name'),
                interaction.user,
                data,
                interaction.guild!
            )
            await interaction.followUp({
                content: res.message
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "register-form",
}