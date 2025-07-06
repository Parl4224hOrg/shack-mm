import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {games, userOptional} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {getStats} from "../../modules/getters/getStats";
import {getMMRGraph} from "../../utility/graph";
import {MessageFlagsBitField} from "discord.js";

export const graph: Command = {
    data: new SlashCommandBuilder()
        .setName('graph')
        .setDescription("Get rank graph")
        .addIntegerOption(games)
        .addUserOption(userOptional("User to get graph of")),
    run: async (interaction, data) => {
        try {
            let gameNumber = interaction.options.getInteger('games');
            if (!gameNumber) {
                gameNumber = 10;
            }
            let user = interaction.options.getUser('user');
            if (!user) {
                user = interaction.user;
            }
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
                    files: [await getMMRGraph(stats.mmrHistory, start, stats.gamesPlayedSinceReset, user.username)]
                });
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'graph',
    allowedRoles: [tokens.Player],
    allowedChannels: [tokens.SNDChannel]
}