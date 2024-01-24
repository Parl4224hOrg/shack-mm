import {SubCommand} from "../../../interfaces/Command";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {logError} from "../../../loggers";
import {getUserByUser} from "../../../modules/getters/getUser";
import {queues, userOption} from "../../../utility/options";
import tokens from "../../../tokens";

export const remove: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('remove')
        .setDescription('removes a user from a queue')
        .addStringOption(queues)
        .addUserOption(userOption('User to remove from queue')),
    run: async (interaction, data) => {
        try {
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user, data);
            data.removeFromAllQueues(dbUser._id);
            await interaction.reply({ephemeral: true, content: `<@${user.id}> Has been removed from queue`});
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 'remove',
    allowedRoles: [tokens.ModRole],
}