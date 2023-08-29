import {SubCommand} from "../../../interfaces/Command";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {logError} from "../../../loggers";
import {getUserByUser} from "../../../modules/getters/getUser";
import {queues, userOption} from "../../../utility/options";

export const remove: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('remove')
        .setDescription('removes a user from a queue')
        .addStringOption(queues)
        .addUserOption(userOption('User to remove from queue')),
    run: async (interaction, data) => {
        try {
            const queue = interaction.options.getString('queue', true);
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user);
            if (queue == 'ALL') {
                data.removeFromAllQueues(dbUser._id);
                await interaction.reply({ephemeral: true, content: `Removed ${user.toString()} from all queues`});
            } else {
                data.removeFromQueue(dbUser._id, queue);
                await interaction.reply({ephemeral: true, content: `Removed ${user.toString()} from ${queue} queue`});
            }
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 'clear'
}