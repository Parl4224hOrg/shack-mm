import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {SlashCommandIntegerOption} from "discord.js";
import {logError} from "../../loggers";

export const pingMe: Command = {
    data: new SlashCommandBuilder()
        .setName("ping_me")
        .setDescription("Pings you once a certain number in queue is reached. Expires after 30 minutes")
        .addIntegerOption(new SlashCommandIntegerOption()
            .setName("in_queue")
            .setDescription("Number of players in queue to ping at")
            .setRequired(true)
            .setMinValue(4)
            .setMaxValue(9))
        .addIntegerOption(new SlashCommandIntegerOption()
            .setName('expire_time')
            .setDescription("Set how long until your ping me expires. <1 for infinite, 0 to remove, >1 for the time specified")
            .setRequired(true)),
    run: async (interaction, data) => {
        try {
            const time = interaction.options.getInteger('expire_time', true);
            await data.addPingMe("SND", "FILL", interaction.user, interaction.options.getInteger('in_queue', true), time);
            await interaction.reply({content: `Added ping me for ${interaction.options.getInteger('in_queue', true)} in queue`})
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'ping_me'
}