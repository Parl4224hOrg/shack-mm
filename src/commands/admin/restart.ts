import {Command} from "../../interfaces/Command";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import {SlashCommandBuilder} from "@discordjs/builders";
import {MessageFlagsBitField} from "discord.js";
import {closeStatsBrowser} from "../../utility/stats";

export const restart: Command = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription("Restarts the bot"),
    run: async (interaction) => {
        try {
            await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: 'Restarting bot'});
            try {
                await closeStatsBrowser();
            } catch (error) {
                console.error("Failed to close stats browser before restart", error);
            }
            process.exit(1);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'restart',
    allowedRoles: [tokens.AdminRole],
}
