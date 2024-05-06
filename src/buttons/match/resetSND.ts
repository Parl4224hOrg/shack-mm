import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
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
                await interaction.reply({ephemeral: true, content: "Could not find game"});
            } else {
                await game.resetSND();
                const name = game.server!.name
                if (name == "NAE-ONE shackmm.com") {
                    await axios.post(`https://shackmm.com/NAE-ONE/start?game=${game.matchNumber}`, {},
                        {
                        headers: {
                            key: tokens.ServerKey,
                        }
                    })
                } else {
                    await axios.post(`https://shackmm.com/NAE-TWO/start?game=${game.matchNumber}`, {},
                        {
                            headers: {
                                key: tokens.ServerKey,
                            }
                        })
                }

                await interaction.reply({ephemeral: false, content: `Game started by <@${dbUser.id}>`});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'reset-snd-button',
}