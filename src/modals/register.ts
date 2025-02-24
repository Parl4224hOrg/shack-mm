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
        console.time("Register Modal Execution Time");
        try {
            console.time("Defer Reply");
            await interaction.deferReply({ephemeral: true});
            console.timeEnd("Defer Reply");

            console.time("Get Name Input");
            const name = interaction.fields.getTextInputValue('name');
            console.timeEnd("Get Name Input");

            console.time("Fetch User from Database");
            const dbUser = await getUserByUser(interaction.user, data);
            console.timeEnd("Fetch User from Database");

            console.time("Update User");
            dbUser.oculusName = name.replace("<@", "").replace(">", "");
            await updateUser(dbUser, data);
            console.timeEnd("Update User");

            console.time("Fetch Guild Member");
            const member = await interaction.guild!.members.fetch(interaction.user);
            console.timeEnd("Fetch Guild Member");

            console.time("Add Role");
            await member.roles.add(tokens.Player);
            console.timeEnd("Add Role");

            console.time("Follow Up Interaction");
            await interaction.followUp({
                ephemeral: true,
                content: `Go to <#${tokens.RegionSelect}> to select a region (required)\nGo to <#${tokens.SNDReadyChannel}> to ready up or use \`/ready 5v5\`\nTo change your registered name use \`/register\` or the button above`,
            });
            console.timeEnd("Follow Up Interaction");
        } catch (e) {
            console.time("Error Logging");
            await logError(e, interaction);
            console.timeEnd("Error Logging");
        }
        console.timeEnd("Register Modal Execution Time");

    },
    id: "register-form",
}