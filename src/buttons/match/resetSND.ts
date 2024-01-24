import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";

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
                const res = await game.resetSND();
                if (res.Successful) {
                    await interaction.reply({ephemeral: false, content: `Game started by <@${dbUser.id}>`});
                } else {
                    await interaction.reply({ephemeral: true, content: "Could not start game if this persists please contact mods"});
                }
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'reset-snd-button',
}