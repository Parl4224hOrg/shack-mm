import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
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
            const start = stats.gamesPlayedSinceReset - gameNumber + 1;
            if (stats.gamesPlayedSinceReset < 20) {
                await interaction.reply({
                    flags: MessageFlagsBitField.Flags.Ephemeral,
                    content: "A user must play 20 games before they can be graphed"
                })
            } else if (start < 10) {
                await interaction.reply({
                    flags: MessageFlagsBitField.Flags.Ephemeral,
                    content: `You are trying to graph more games than the user has played the largest number you can enter is ${stats.gamesPlayedSinceReset - 10}`
                });
            } else {
                await interaction.reply({
                    content: "Displaying Graph",
                    files: [await getMMRGraph(stats.mmrHistory, start, stats.gamesPlayedSinceReset, user.username)],
                    flags: MessageFlagsBitField.Flags.Ephemeral,
                });
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'graph-queue',
}