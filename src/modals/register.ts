import {Modal} from "../interfaces/Modal";
import {
    ActionRowBuilder,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import {logError} from "../loggers";
import {getUserByUser} from "../modules/getters/getUser";
import {updateUser} from "../modules/updaters/updateUser";
import tokens from "../tokens";

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
            const name = interaction.fields.getTextInputValue('name');
            const dbUser = await getUserByUser(interaction.user, data);
            dbUser.oculusName = name.replace("<@", "").replace(">", "");
            await updateUser(dbUser, data);
            const member = await interaction.guild!.members.fetch(interaction.user);
            await member.roles.add(tokens.Player);
            await interaction.reply({
                ephemeral: true,
                content: `Go to <#${tokens.RegionSelect}> to select a region (required)\nGo to <#${tokens.SNDReadyChannel}> to ready up or use \`/ready 5v5\`\nTo change your registered name use \`/register\` or the button above`,
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "register-form",
}