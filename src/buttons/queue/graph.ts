import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../loggers";

//button specific imports
import {getUserByUser} from "../../modules/getters/getUser";
import {getStats} from "../../modules/getters/getStats";
import {getMMRGraph} from "../../utility/graph";

export const graphButton: Button = {
    data: new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setLabel("Graph")
        .setCustomId('graph-queue'),
    run: async (interaction, data) => {
        try {
            let gameNumber = 10;//modal thing here, one the modal file and code is done
            if (!gameNumber) {
                gameNumber = 10;
            }
            let user = interaction.user;
            const dbUser = await getUserByUser(user, data);
            const stats = await getStats(dbUser._id, "SND");
            const start = stats.gamesPlayed - gameNumber + 1;
            if (stats.gamesPlayed < 20) {
                await interaction.reply({
                    ephemeral: true,
                    content: "A user must play 20 games before they can be graphed"
                })
            } else if (start < 10) {
                await interaction.reply({
                    ephemeral: true,
                    content: `You are trying to graph more games than the user has played the largest number you can enter is ${stats.gamesPlayed - 10}`
                });
            } else {
                await interaction.reply({
                    content: "Displaying Graph",
                    files: [await getMMRGraph(stats.mmrHistory, start, stats.gamesPlayed, user.username)]
                });
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'graph-queue',
}