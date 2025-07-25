import {Modal} from "../interfaces/Modal";
import {
    ActionRowBuilder, MessageFlagsBitField,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import {logError} from "../loggers";
import {getUserByUser} from "../modules/getters/getUser";
import {updateUser} from "../modules/updaters/updateUser";
export const reRegister: Modal = {
    data: new ModalBuilder()
        .setTitle("Register")
        .setCustomId("re-register-form")
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
            const name = interaction.fields.getTextInputValue('name');
            const dbUser = await getUserByUser(interaction.user, data);
            dbUser.oculusName = name.replace("<@", "").replace(">", "");
            await updateUser(dbUser, data);
            await interaction.reply({
                flags: MessageFlagsBitField.Flags.Ephemeral,
                content: "You have updated your registered name",
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "re-register-form",
}