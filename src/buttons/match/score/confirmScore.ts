import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../../../loggers";
import {getUserByUser} from "../../../modules/getters/getUser";

export const confirmScore: Button = {
    data: new ButtonBuilder()
        .setLabel("Confirm Scores")
        .setStyle(ButtonStyle.Success)
        .setCustomId('score-accept'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const controller = data.findController();
            if (controller) {
                const game = controller.findGame(dbUser._id);
                if (game) {
                    const response = await game.acceptScore(dbUser._id);
                    await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: response.message});
                } else {
                    await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Could not find game please contact a mod"});
                }
            } else {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Could not find controller please contact a mod"})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'score-accept',
}