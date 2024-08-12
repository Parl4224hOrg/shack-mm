import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import tokens from "../../tokens";

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
            await interaction.reply({ephemeral: true, content: status});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'server_status',
    allowedUsers: [tokens.Parl],
    allowedRoles: tokens.Mods,
}