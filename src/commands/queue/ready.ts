import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import {matchReady} from "../../utility/match";
import {queuesSpecific} from "../../utility/options";

export const ready: Command = {
    data: new SlashCommandBuilder()
        .setName('ready')
        .setDescription('Readies you for a game in a queue')
        .addStringOption(queuesSpecific)
        .addIntegerOption(option => option
            .setName('time')
            .setDescription('Time to ready up for')
            .setRequired(true)
            .setMinValue(5)
            .setMaxValue(120)
        ),
    run: async (interaction, data) => {
        try {
            const queueOption = interaction.options.getString('queue', true);
            const queueId = queueOption.substring(0, queueOption.indexOf('-'));
            // const queue = queueOption.substring(queueOption.indexOf('-') + 1); Add back if multiple region split
            const time = interaction.options.getInteger('time', true);
            await matchReady(interaction, data, queueId, "FILL", time);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 'ready',
}