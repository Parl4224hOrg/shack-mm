import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {RateLimiter} from "discord.js-rate-limiter";
import {getUserByUser} from "../../modules/getters/getUser";
import {logError} from "../../loggers";

export const missing: Button = {
    data: new ButtonBuilder()
        .setLabel('Missing')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('missing-button'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const controller = data.findController();
            if (controller) {
                const response = controller.getMissing(dbUser._id);
                await interaction.reply({ephemeral: false, content: response});
            } else {
                await interaction.reply({ephemeral: true, content: "Could not find controller please contact a mod"})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'missing-button',
    limiter: new RateLimiter(1, 10000),
}