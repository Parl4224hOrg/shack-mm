import {ButtonBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {Button} from "../../interfaces/Button";
import {ButtonStyle, MessageFlagsBitField, TextChannel} from "discord.js";
import tokens from "../../tokens";

export const switchMap: Button = {
    data: new ButtonBuilder()
        .setLabel('Switch Map')
        .setStyle(ButtonStyle.Danger)
        .setCustomId('switch-map'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const game = data.findGame(dbUser._id);
            if (game) {
                const channel = await interaction.client.channels.fetch(tokens.GameLogChannel) as TextChannel;
                await channel.send(`<@${interaction.user.id}> | ${interaction.user.id} | ${interaction.user.username}\nswitched maps | match: ${game.matchNumber} on server: ${game.server?.id ?? "not assigned"}`);
                await interaction.deferReply();
                await game.switchMap();
                await interaction.followUp({content: `Map switched by <@${interaction.user.id}>`});
            } else {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Could not find game"});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'switch-map',
}