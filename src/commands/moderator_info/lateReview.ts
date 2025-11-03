import { SubCommand } from "../../interfaces/Command";
import { userOption } from "../../utility/options";
import { logError, logSMMInfo } from "../../loggers";
import tokens from "../../tokens";
import { getUserByUser } from "../../modules/getters/getUser";
import { MessageFlagsBitField, SlashCommandIntegerOption, SlashCommandSubcommandBuilder } from "discord.js";
import LateModel from "../../database/models/LateModel";
import GameModel from "../../database/models/GameModel";

export const lateReview: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("late_review")
        .setDescription("Shows how much a user was late for their last X games with match IDs")
        .addUserOption(userOption("User to review late stats for"))
        .addIntegerOption(new SlashCommandIntegerOption()
            .setName('games')
            .setDescription('Number of recent games to check (default: 10)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(30)),
    run: async (interaction, data) => {
        try {
            const user = interaction.options.getUser('user', true);
            const gamesCount = interaction.options.getInteger('games', false) || 10;
            const dbUser = await getUserByUser(user, data);

            // Get the latest X games where the user participated
            const games = await GameModel.find({
                users: dbUser._id,
                scoreB: { $gte: 0 },
                scoreA: { $gte: 0 }
            }).sort({ creationDate: -1 }).limit(gamesCount);

            if (games.length === 0) {
                await interaction.reply({
                    content: `${user.username} has no completed games to review.`
                });
                return;
            }

            // Extract match IDs from the games
            const matchIds = games.map(game => game.matchId);

            // Get late records for this user that match these games
            const lates = await LateModel.find({
                user: dbUser.id,
                matchId: { $in: matchIds }
            }).sort({ matchId: -1 });

            let response = `**Late Review for ${user.username} - Last ${games.length} Games:**\n\n`;

            // Go through games in reverse order (newest first) and show late status
            for (let i = 0; i < games.length; i++) {
                const game = games[i];
                const lateRecord = lates.find(late => late.matchId === game.matchId);

                response += `**Match ${game.matchId}:** `;

                if (lateRecord) {
                    const lateBySeconds = (lateRecord.joinTime - lateRecord.channelGenTime) - 5 * 60;
                    if (lateBySeconds > 0) {
                        response += `Late by ${lateBySeconds.toFixed(0)} seconds\n`;
                    } else {
                        response += `On time\n`;
                    }
                } else {
                    response += `No late record\n`;
                }
            }

            // Add summary
            const actualLates = lates.filter(late => (late.joinTime - late.channelGenTime) - 5 * 60 > 0);
            response += `\n**Summary:** ${actualLates.length}/${games.length} games with late arrivals`;

            await interaction.reply({
                content: response
            });
            //log the cmd
            let logMessage = `<@${interaction.user.id}> used late review on <@${user.id}>.`;
            let modAction = `<@${interaction.user.id}> used late_review`;
            await logSMMInfo(logMessage, interaction.client, modAction);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "late_review",
    allowedRoles: tokens.Mods,
}
