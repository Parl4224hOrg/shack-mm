import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {SlashCommandUserOption} from "discord.js";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {getStats} from "../../modules/getters/getStats";
import {updateStats} from "../../modules/updaters/updateStats";

export const transferUser: Command = {
    data: new SlashCommandBuilder()
        .setName('transfer_user')
        .setDescription("Transfers a user's stats")
        .addUserOption(new SlashCommandUserOption()
            .setName('old_user')
            .setDescription("The User's old account or <@id> if account is no longer in server")
            .setRequired(true))
        .addUserOption(new SlashCommandUserOption()
            .setName('new_user')
            .setDescription("The User's new account")
            .setRequired(true)),
    run: async (interaction, data) => {
        try {
            const oldUser = await getUserByUser(interaction.options.getUser('old_user', true), data);
            const newUser = await getUserByUser(interaction.options.getUser('new_user', true), data);

            const stats = await getStats(oldUser._id, "SND");

            stats.userId = newUser._id;

            await updateStats(stats);

            await interaction.reply({ephemeral: true, content: `Stats have been transferred from <@${oldUser.id}> to <@${newUser.id}>`})
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'transfer_user',
    allowedRoles: tokens.Mods,
}