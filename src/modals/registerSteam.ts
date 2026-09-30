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

export const registerSteamModal: Modal = {
    data: new ModalBuilder()
        .setTitle("Register Steam ID")
        .setCustomId("register-steam-form")
        .setComponents([
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId("steam-id")
                    .setLabel("Steam ID")
                    .setPlaceholder("Find your SteamID64 at steamid.io")
                    .setMinLength(1)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            )
        ]),
    run: async (interaction, data) => {
        try {
            await interaction.deferReply({flags: MessageFlagsBitField.Flags.Ephemeral});
            const res = await handleRegister(
                interaction.fields.getTextInputValue("steam-id"),
                interaction.user,
                data,
                interaction.guild!,
                "steamId"
            );
            await interaction.followUp({content: `${res.message}\nFind your SteamID64: <https://steamid.io/>`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "register-steam-form",
};
