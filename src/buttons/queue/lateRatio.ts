import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import LateModel from "../../database/models/LateModel";

export const lateRatioButton: Button = {
    data: new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setLabel("Late Ratio")
        .setCustomId('late-ratio-button'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const lates = await LateModel.find({user: dbUser.id});
            let totalTime = 0;
            for (const late of lates) {
                // Subtract 60 seconds times 5 minutes to account for allowed join time
                totalTime += (late.joinTime - late.channelGenTime) - 5 * 60;
            }
            const avgLateTime = totalTime / lates.length;
            const latePercent = (lates.length / (dbUser.gamesPlayedSinceLates + 1)) * 100;
            const latePercentNeeded = 53.868 * Math.exp(-0.00402 * avgLateTime);
            await interaction.reply({
                flags: MessageFlagsBitField.Flags.Ephemeral, 
                content: `${interaction.user.username} is late ${latePercent.toFixed(2)}% by an average of ${avgLateTime.toFixed(2)} seconds. They need to be late ${latePercentNeeded.toFixed(2)}% to receive a cooldown.`
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'late-ratio-button',
}
