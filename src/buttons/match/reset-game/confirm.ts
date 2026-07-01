import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, TextChannel} from "discord.js";
import {Button} from "../../../interfaces/Button";
import {getUserByUser} from "../../../modules/getters/getUser";
import {logError} from "../../../loggers";
import tokens from "../../../tokens";

export const confirmResetGame: Button = {
    data: new ButtonBuilder()
        .setLabel("Start Game")
        .setStyle(ButtonStyle.Success)
        .setCustomId('confirm_reset_game'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const game = data.findGame(dbUser._id);
            if (!game) {
                await interaction.update({content: "Could not find game", components: []});
            } else {
                const channel = await interaction.client.channels.fetch(tokens.GameLogChannel) as TextChannel;
                await interaction.update({content: "Starting game...", components: []});
                await channel.send({
                    content: `<@${interaction.user.id}> | ${interaction.user.id} | ${interaction.user.username}\nreset the game | match: ${game.matchNumber} on server: ${game.server?.id ?? "not assigned"}`,
                    allowedMentions: {users: []}
                });
                await game.resetSND();
                await interaction.followUp({content: `Game started by <@${dbUser.id}>`});
            }
        } catch (e) {
            await logError(e, interaction)
        }
    },
    id: 'confirm_reset_game',
}
