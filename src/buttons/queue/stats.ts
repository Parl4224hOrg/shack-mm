import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {getStats} from "../../modules/getters/getStats";
import {generateStatsImage} from "../../utility/stats";

export const stats: Button = {
    data: new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Stats")
        .setCustomId("stats-queue"),
    run: async (interaction, data) => {
        try {
            const user = await getUserByUser(interaction.user, data);
            const userStats = await getStats(user._id, "SND");
            if (userStats.gamesPlayedSinceReset < 10) {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "This user has not played enough games to view their stats, you can still see their current available stats by setting the use-old-stats option to true."});
            } else {
                const image = await generateStatsImage(userStats, interaction.user.displayName);
                await interaction.reply({files: [image]});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "stats-queue",
}