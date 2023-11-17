import {SubCommand} from "../../../interfaces/Command";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {matchReady} from "../../../utility/match";
import {logError} from "../../../loggers";

export const fiveVFive: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("5v5")
        .setDescription("Ready for 5v5 queue")
        .addIntegerOption(option => option
            .setName('time')
            .setDescription('Time to _ready up for')
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
    name: '5v5'
}