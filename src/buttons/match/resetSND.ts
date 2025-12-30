import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField, TextChannel} from "discord.js";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import axios from "axios";
import tokens from "../../tokens";

export const resetSND: Button = {
    data: new ButtonBuilder()
        .setLabel("Start Game")
        .setStyle(ButtonStyle.Danger)
        .setCustomId('reset-snd-button'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const game = data.findGame(dbUser._id);
            if (!game) {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Could not find game"});
            } else {
                const channel = await interaction.client.channels.fetch(tokens.GameLogChannel) as TextChannel;
                await channel.send(`<@${interaction.user.id}> | ${interaction.user.id} | ${interaction.user.username}\nreset the game | match: ${game.matchNumber} on server: ${game.server?.id ?? "not assigned"}`);
                await game.resetSND();
                await axios.post(`https://shackmm.com/kill-feed/${game.server!.id}/start?game=${game.matchNumber}`, {},
                    {
                        headers: {
                            key: tokens.ServerKey,
                        }
                    });
                await interaction.reply({content: `Game started by <@${dbUser.id}>`});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'reset-snd-button',
}