import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {matchUnready} from "../../utility/match";
import {logError} from "../../loggers";
import {queues} from "../../utility/options";

export const unready: Command = {
    data: new SlashCommandBuilder()
        .setName('unready')
        .setDescription('Allows you to unready from queues')
        .addStringOption(queues),
    run: async (interaction, data) => {
        try {
            const queueId = interaction.options.getString('queue', true);
            await matchUnready(interaction, data, queueId);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 'unready'
}