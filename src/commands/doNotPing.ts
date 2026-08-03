import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {MessageFlagsBitField} from "discord.js";
import {logError} from "../loggers";
import tokens from "../tokens";

export const doNotPing: Command = {
    data: new SlashCommandBuilder()
        .setName("do-not-ping")
        .setDescription("Toggle the Do Not Ping role"),
    run: async (interaction) => {
        try {
            const member = await interaction.guild!.members.fetch(interaction.user.id);
            const hasRole = member.roles.cache.has(tokens.DoNotPing);
            await member.roles[hasRole ? "remove" : "add"](tokens.DoNotPing);
            await interaction.reply({
                flags: MessageFlagsBitField.Flags.Ephemeral,
                content: hasRole ? "Do Not Ping role removed." : "Do Not Ping role added.",
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "do-not-ping",
};