import {Button} from "../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../loggers";
import tokens from "../tokens";

export const signup: Button = {
    data: new ButtonBuilder()
        .setLabel('Sign Up')
        .setCustomId('sign-up')
        .setStyle(ButtonStyle.Success),
    run: async (interaction) => {
        try {
            const member = await interaction.guild!.members.fetch(interaction.user.id);
            await member.roles.add(tokens.Player)
            await interaction.reply({ephemeral: true, content: `You have signed up go to <#${tokens.SNDReadyChannel}>`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'sign-up',
}