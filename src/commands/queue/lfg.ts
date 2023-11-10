import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import tokens from "../../tokens";

export const lfg: Command = {
    data: new SlashCommandBuilder()
        .setName('lfg')
        .setDescription('See who is in queue'),
    run: async (interaction, data) => {
        try {
            await interaction.reply({ephemeral: false, content: data.inQueueSND()});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'lfg',
    allowedChannels: [tokens.SNDChannel],
}