import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {queueOptions} from "../../utility/queues";
import {matchUnready} from "../../utility/match";
import {logError} from "../../loggers";

export const unready: Command = {
    data: new SlashCommandBuilder()
        .setName('unready')
        .setDescription('Allows you to unready from queues')
        .addStringOption(queueOptions),
    run: async (interaction, data) => {
        try {
            const queueId = interaction.options.getString('queues', true);
            await matchUnready(interaction, data, queueId);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 'unready'
}