import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, TextChannel} from "discord.js";
import {getUserByUser} from "../../../modules/getters/getUser";
import {Button} from "../../../interfaces/Button";
import {logError} from "../../../loggers";
import tokens from "../../../tokens";

export const confirmSwitchMap: Button = {
    data: new ButtonBuilder()
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Success)
        .setCustomId('confirm_switch_map'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const game = data.findGame(dbUser._id);
            if (game) {
                const channel = await interaction.client.channels.fetch(tokens.GameLogChannel) as TextChannel;
                await channel.send(`<@${interaction.user.id}> | ${interaction.user.id} | ${interaction.user.username}\nswitched maps | match: ${game.matchNumber} on server: ${game.server?.id ?? "not assigned"}`);
                await interaction.update({content: "Switching map...", components: []});
                await interaction.deferReply();
                await game.switchMap();
                await interaction.followUp({content: `Map switched by <@${interaction.user.id}>`});
            } else {
                await interaction.update({content: "Could not find game", components: []});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'confirm_switch_map',
}