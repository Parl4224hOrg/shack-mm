import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import {MessageFlagsBitField} from "discord.js";

export const serverStatus: Command = {
    data: new SlashCommandBuilder()
        .setName("server_status")
        .setDescription("Displays the server status"),
    run: async (interaction, data) => {
        try {
            let status = "```";
            for (let game of data.getQueue().activeGames) {
                status += `${game.matchNumber}: ${game.serverId}\n`;
            }
            status += "```";
            await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: status});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'server_status',
    allowedUsers: [tokens.Parl],
    allowedRoles: tokens.Mods,
}