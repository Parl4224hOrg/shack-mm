import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {getStats} from "../../modules/getters/getStats";
import {statsEmbed} from "../../embeds/statsEmbed";

export const stats: Button = {
    data: new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Stats")
        .setCustomId("stats-queue"),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const stats = await getStats(dbUser._id, "SND");
            await interaction.reply({ephemeral: true, embeds: [statsEmbed(stats, dbUser, interaction.user.username,  interaction.user.avatarURL()!)]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "stats-queue",
}