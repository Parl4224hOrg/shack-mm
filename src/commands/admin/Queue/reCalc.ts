import {SubCommand} from "../../../interfaces/Command";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {logError} from "../../../loggers";
import {queueOptions} from "../../../utility/queues";

export const reCalc: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('re_calc')
        .setDescription('re_calcs mmr for a queue')
        .addStringOption(queueOptions),
    run: async (interaction) => {
        try {
            await interaction.reply({ephemeral: true, content: 'not functional yet'})
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 're_calc'
}