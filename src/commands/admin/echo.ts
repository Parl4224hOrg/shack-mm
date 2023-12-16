import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {SlashCommandStringOption} from "discord.js";
import {logError} from "../../loggers";
import tokens from "../../tokens";

export const echo: Command = {
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription("Makes the bot say what you say")
        .addStringOption(new SlashCommandStringOption()
            .setName('message')
            .setDescription("Message for bot to repeat")
            .setRequired(true)),
    run: async (interaction) => {
        try {
            const message = interaction.options.getString('message', true);
            await interaction.reply({ephemeral: true, content: "Sending message"});
            await interaction.channel!.send(message);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'echo',
    allowedRoles: [tokens.LeadModRole],
}