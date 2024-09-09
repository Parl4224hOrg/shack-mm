import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../loggers";
//button specific imports
import {getUserByUser} from "../../modules/getters/getUser";
import {getStats} from "../../modules/getters/getStats";

export const ratingChangeButton: Button = {
    data: new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Rating Change")
        .setCustomId("rating-change-button"),
    run: async (interaction, data) => {
        try {
            let user = interaction.user;
            let self = false;
            if (!user) {
                self = true;
                user = interaction.user;
            }

            const dbUser = await getUserByUser(user, data);
            const stats = await getStats(dbUser._id, "SND");
            if (stats.gamesPlayed < 11) {
                await interaction.reply({ephemeral: true, content: "This user has not played enough games to use this feature yet"});
            } else {
                if (self) {
                    await interaction.reply({content: `Your rating changed by ${stats.ratingChange.toFixed(1)} last game`});
                } else {
                    await interaction.reply({content: `${user.username}'s rating changed by ${stats.ratingChange.toFixed(1)} last game`});
                }
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'rating-change-button',
}