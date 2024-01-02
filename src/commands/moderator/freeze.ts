import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {updateUser} from "../../modules/updaters/updateUser";
import tokens from "../../tokens";

export const freeze: Command = {
    data: new SlashCommandBuilder()
        .setName('freeze')
        .setDescription("Freezes a user")
        .addUserOption(userOption("User to freeze")),
    run: async (interaction) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true));
            dbUser.frozen = !dbUser.frozen;
            await updateUser(dbUser);
            if (dbUser.frozen) {
                await interaction.reply({ephemeral: false, content: `<@${dbUser.id}> has been frozen`});
            } else {
                await interaction.reply({ephemeral: false, content: `<@${dbUser.id}> has been unfrozen`});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'freeze',
    allowedRoles: [tokens.ModRole],
}