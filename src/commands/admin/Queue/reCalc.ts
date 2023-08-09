import {SubCommand} from "../../../interfaces/Command";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {logError} from "../../../loggers";
import {queues} from "../../../utility/options";

export const reCalc: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('re_calc')
        .setDescription('re_calcs mmr for a queue')
        .addStringOption(queues),
    run: async (interaction) => {
        try {
            await interaction.reply({ephemeral: true, content: 'not functional yet'})
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 're_calc'
}