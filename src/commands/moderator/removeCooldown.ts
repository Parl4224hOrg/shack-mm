import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {reason, userOption} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {createActionUser} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import {getUserByUser} from "../../modules/getters/getUser";
import {updateUser} from "../../modules/updaters/updateUser";

export const removeCooldown: Command = {
    data: new SlashCommandBuilder()
        .setName('remove_cooldown')
        .setDescription("Removed a cooldown without changing the user's ban counter")
        .addUserOption(userOption('User to remove cooldown of'))
        .addStringOption(reason),
    run: async (interaction) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true));
            dbUser.banUntil = 0;
            await updateUser(dbUser);
            await interaction.reply({ephemeral: false, content: `<@${dbUser.id}> cooldown removed`});
            await createActionUser(Actions.RemoveCooldown, interaction.user.id, dbUser.id, interaction.options.getString('reason', true), 'cooldown removed');
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'remove_cooldown',
    allowedRoles: [tokens.ModRole, tokens.AdminRole],
}