import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../../loggers";
import {getUserByUser} from "../../../modules/getters/getUser";

export const confirmScore: Button = {
    data: new ButtonBuilder()
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Success)
        .setCustomId('score-accept'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user);
            const controller = data.findController(dbUser._id);
            if (controller) {
                const game = controller.findGame(dbUser._id);
                if (game) {
                    const response = game.acceptScore(dbUser._id);
                    await interaction.reply({ephemeral: false, content: response.message});
                } else {
                    await interaction.reply({ephemeral: true, content: "Could not find game please contact a mod"});
                }
            } else {
                await interaction.reply({ephemeral: true, content: "Could not find controller please contact a mod"})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'score-accept',
}