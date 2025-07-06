import {Button} from "../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {RateLimiter} from "discord.js-rate-limiter";
import {logError} from "../loggers";
import tokens from "../tokens";

export const mapTesterToggle: Button = {
    data: new ButtonBuilder()
        .setLabel("Toggle Map Tester Role")
        .setStyle(ButtonStyle.Primary)
        .setCustomId('map-tester-toggle'),
    run: async (interaction) => {
        try{
            const member = await interaction.guild!.members.fetch(interaction.user.id);
            if (member.roles.cache.has(tokens.MapTesterRole)) {
                await member.roles.remove(tokens.MapTesterRole);
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Map Tester role removed"});
            } else {
                await member.roles.add(tokens.MapTesterRole);
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Map Tester role added"});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'map-tester-toggle',
    limiter: new RateLimiter(2, 20000)
}