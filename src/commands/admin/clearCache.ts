import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import tokens from "../../tokens";

export const clearCache: Command = {
    data: new SlashCommandBuilder()
        .setName("clear_cache")
        .setDescription("Clears the cache of the bot"),
    run: async (interaction, data) => {
        try {
            data.clearCache();
            await interaction.reply("Cache cleared successfully")
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "clear_cache",
    allowedUsers: [tokens.Parl],
}