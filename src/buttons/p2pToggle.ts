import {Button} from "../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {RateLimiter} from "discord.js-rate-limiter";
import {logError} from "../loggers";
import tokens from "../tokens";

export const p2pToggle: Button = {
    data: new ButtonBuilder()
        .setLabel("Toggle Ping to Play")
        .setStyle(ButtonStyle.Primary)
        .setCustomId('p2p-toggle'),
    run: async (interaction) => {
        try{
            const member = await interaction.guild!.members.fetch(interaction.user.id);
            if (member.roles.cache.has(tokens.PingToPlayRole)) {
                await member.roles.remove(tokens.PingToPlayRole);
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Ping to Play role removed"});
            } else {
                await member.roles.add(tokens.PingToPlayRole);
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Ping to Play role added"});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'p2p-toggle',
    limiter: new RateLimiter(2, 20000)
}