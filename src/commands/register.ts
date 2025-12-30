import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {MessageFlagsBitField, SlashCommandStringOption} from "discord.js";
import {logError} from "../loggers";
import {handleRegister} from "../utility/register";

export const register: Command = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription("Register an oculus name to display")
        .addStringOption(new SlashCommandStringOption()
            .setName('name')
            .setDescription("Name to register")
            .setRequired(true)),
    run: async (interaction, data) => {
        try {
            await interaction.deferReply({flags: MessageFlagsBitField.Flags.Ephemeral});
            const res = await handleRegister(
                interaction.options.getString('name', true),
                interaction.user,
                data,
                interaction.guild!
            )
            await interaction.followUp({
                content: res.message
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'register',
}