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
            .setRequired(false)
        ),
    run: async (interaction, data) => {
        try {
            let time = interaction.options.getInteger('time', false);
            if (time) {
                time = Math.max(Math.min(time, 120), 5)
            } else {
                time = 30;
            }
            await matchReady(interaction, data, "SND", "FILL", time);
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: '5v5'
}