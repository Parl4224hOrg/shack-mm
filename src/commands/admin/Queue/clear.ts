import {SubCommand} from "../../../interfaces/Command";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {logError} from "../../../loggers";

export const clear: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('clear')
        .setDescription('clears a queue')
        .addStringOption(option => option
            .setName('queue')
            .setDescription('The queue to clear')
            .setRequired(true)
            .setChoices({name: 'SND', value: 'SND'})
        ),
    run: async (interaction, data) => {
        try {
            data.clearQueue(interaction.options.getString('queue', true));
            await interaction.reply({ephemeral: true, content: 'Queue cleared'});
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 'clear'
}