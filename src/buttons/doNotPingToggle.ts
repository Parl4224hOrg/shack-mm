import {Button} from "../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {RateLimiter} from "discord.js-rate-limiter";
import {logError} from "../loggers";
import tokens from "../tokens";

export const doNotPingToggle: Button = {
    data: new ButtonBuilder().setLabel("Do Not Ping").setStyle(ButtonStyle.Secondary).setCustomId("do-not-ping-toggle"),
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
    id: "do-not-ping-toggle",
    limiter: new RateLimiter(2, 20000),
};
