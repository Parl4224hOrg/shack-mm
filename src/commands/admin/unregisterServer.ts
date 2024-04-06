import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {SlashCommandStringOption} from "discord.js";
import {logError} from "../../loggers";
import tokens from "../../tokens";

export const unregisterServer: Command = {
    data: new SlashCommandBuilder()
        .setName("unregister_server")
        .setDescription("unregister a server from use")
        .addStringOption(new SlashCommandStringOption()
            .setName('server')
            .setDescription("Server ID")
            .setRequired(true)
            .setChoices({
                name: "NAE-ONE",
                value: "SMM NAE ONE",
            },{
                name: "NAE-TWO",
                value: "SMM NAE TWO",
            })),
    run: async (interaction, data) => {
        try {
            let found = false
            for (let server of data.getServers()) {
                if (server.name == interaction.options.getString("server", true)) {
                    server.unregisterGame();
                    found = true;
                }
            }
            if (found) {
                await interaction.reply({ephemeral: true, content: "Successfully unregistered server"});
            } else {
                 await interaction.reply({ephemeral: true, content: "Could not find server"});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "unregister_server",
    allowedRoles: tokens.Mods
}