import {SubCommand} from "../../interfaces/Command";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import {getUserByUser} from "../../modules/getters/getUser";
import {updateUser} from "../../modules/updaters/updateUser";

export const toggleReferee: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('toggle_referee')
        .setDescription('Toggles whether a user is a referee or not')
        .addUserOption(userOption("User to toggle status of")),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            if (dbUser.referee == null) {
                dbUser.referee = true
            } else {
                dbUser.referee = !dbUser.referee
            }
            await updateUser(dbUser, data);
            await interaction.reply({ephemeral: true, content: `<@${dbUser.id}> ${dbUser.referee ? "is now" : "is no longer"} as referee.`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'toggle_referee',
    allowedRoles: tokens.Mods,
}