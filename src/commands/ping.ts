import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../loggers";

export const ping: Command = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Get latency to the bot"),
    run: async (interaction) => {
        try {
            await interaction.reply(`Pong! ${Date.now() - interaction.createdTimestamp} ms`);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "ping",
}