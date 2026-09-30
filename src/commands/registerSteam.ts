import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {MessageFlagsBitField, SlashCommandStringOption} from "discord.js";
import {logError} from "../loggers";
import {handleRegister} from "../utility/register";

export const registerSteam: Command = {
    data: new SlashCommandBuilder()
        .setName("register_steam")
        .setDescription("Register a Steam ID to use in matches")
        .addStringOption(new SlashCommandStringOption()
            .setName("steam_id")
            .setDescription("Steam ID to register")
            .setRequired(true)),
    run: async (interaction, data) => {
        try {
            await interaction.deferReply({flags: MessageFlagsBitField.Flags.Ephemeral});
            const res = await handleRegister(
                interaction.options.getString("steam_id", true),
                interaction.user,
                data,
                interaction.guild!,
                "steamId"
            );
            await interaction.followUp({content: `${res.message}\nFind your SteamID64: <https://steamid.io/>`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "register_steam",
};
