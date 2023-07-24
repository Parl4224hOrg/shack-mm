import { SlashCommandBuilder } from "@discordjs/builders";
import { Command } from "../../interfaces/Command";
import {logError} from "../../loggers";
import { REST } from "@discordjs/rest";
import tokens from "../../tokens";
import {CommandList} from "../_CommandList";
import { Routes } from "discord-api-types/v9";

export const sync: Command = {
    data: new SlashCommandBuilder()
        .setName("sync")
        .setDescription("Syncs commands with the server"),
    run: async (interaction) => {
        try {
            await interaction.deferReply({ephemeral: true});
            const rest = new REST({ version: "9" }).setToken(
                tokens.BotToken as string
            );
            const commandData = CommandList.map((command) => command.data.toJSON());
            await rest.put(
                Routes.applicationGuildCommands(
                    tokens.ClientID,
                    interaction.guildId as string
                ),
                { body: commandData }
            );
            await interaction.followUp({content: "Commands synced!"})
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 'sync',
    allowedUsers: [tokens.Parl],
}