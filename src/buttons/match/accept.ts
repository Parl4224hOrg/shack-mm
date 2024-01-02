import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {acceptLimiter} from "../../utility/limiters";

export const accept: Button = {
    data: new ButtonBuilder()
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success)
        .setCustomId('match-accept'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user);
            const controller = data.findController();
            if (controller) {
                const response = await controller.acceptGame(dbUser._id);
                await interaction.reply({ephemeral: true, content: response.message});
            } else {
                await interaction.reply({ephemeral: true, content: "Could not find controller please contact a mod"})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'match-accept',
    limiter: acceptLimiter,
}