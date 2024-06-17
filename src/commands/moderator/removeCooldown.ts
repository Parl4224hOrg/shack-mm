import {SubCommand} from "../../interfaces/Command";
import {reason, userOption} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {createActionUser} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import {getUserByUser} from "../../modules/getters/getUser";
import {updateUser} from "../../modules/updaters/updateUser";
import {SlashCommandSubcommandBuilder} from "discord.js";

export const removeCooldown: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('remove_cooldown')
        .setDescription("Removed a cooldown without changing the user's ban counter")
        .addUserOption(userOption('User to remove cooldown of'))
        .addStringOption(reason),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            dbUser.banUntil = 0;
            await updateUser(dbUser, data);
            await createActionUser(Actions.RemoveCooldown, interaction.user.id, dbUser.id, interaction.options.getString('reason', true), 'cooldown removed');
            if (interaction.channel?.type === ChannelType.GuildPublicThread ||
                interaction.channel?.type === ChannelType.GuildPrivateThread ||
                interaction.channel?.type === ChannelType.GuildNewsThread) {
                await interaction.reply({ephemeral: false, content: `<${dbUser.username}> cooldown removed`});
            } else {
                await interaction.reply({ephemeral: false, content: `<@${dbUser.id}> cooldown removed`});
            }
            await interaction.reply({ephemeral: false, content: `<@${dbUser.id}> cooldown removed`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'remove_cooldown',
    allowedRoles: tokens.Mods,
}
