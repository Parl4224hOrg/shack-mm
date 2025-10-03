import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
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