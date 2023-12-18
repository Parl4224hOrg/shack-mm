import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {getRankNumber, getStats} from "../../modules/getters/getStats";
import {statsEmbed} from "../../embeds/statsEmbed";

export const stats: Button = {
    data: new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Stats")
        .setCustomId("stats-queue"),
    run: async (interaction) => {
        try {
            const dbUser = await getUserByUser(interaction.user);
            const stats = await getStats(dbUser._id, "SND");
            await interaction.reply({ephemeral: true, embeds: [statsEmbed(stats, dbUser, interaction.user.username, await getRankNumber(dbUser._id, "SND"), interaction.user.avatarURL()!)]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "stats-queue",
}