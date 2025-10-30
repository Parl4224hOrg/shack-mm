import { SubCommand } from "../../interfaces/Command";
import { userOption } from "../../utility/options";
import tokens from "../../tokens";
import { logError, logModInfo } from "../../loggers";
import { getUserByUser } from "../../modules/getters/getUser";
import { getStats } from "../../modules/getters/getStats";
import { getUserActions } from "../../modules/getters/getAction";
import { Actions, ActionInt } from "../../database/models/ActionModel";
import GameModel from "../../database/models/GameModel";
import { SlashCommandSubcommandBuilder, SlashCommandIntegerOption } from "discord.js";

export const failToAcceptRatio: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('fail_to_accept_ratio')
        .setDescription('Get the ratio of failed accepts to total games played for a user')
        .addUserOption(userOption('User to check fail to accept ratio for'))
        .addIntegerOption((option: SlashCommandIntegerOption) =>
            option.setName('games')
                .setDescription('Only count the latest X games (optional, takes precedence over days)')
                .setRequired(false)
                .setMinValue(1)
        )
        .addIntegerOption((option: SlashCommandIntegerOption) =>
            option.setName('days')
                .setDescription('Only count games and actions within this many days (optional)')
                .setRequired(false)
                .setMinValue(1)
        ),
    run: async (interaction, data) => {
        try {
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user, data);
            const gamesCount = interaction.options.getInteger('games', false);
            const days = interaction.options.getInteger('days', false);

            let totalGames: number;
            let failedAccepts: number;
            let timeBold: string;

            if (gamesCount) {
                // Get the latest X games where the user participated
                const games = await GameModel.find({
                    users: dbUser._id,
                    scoreB: { $gte: 0 },
                    scoreA: { $gte: 0 }
                }).sort({ creationDate: -1 }).limit(gamesCount);
                totalGames = games.length;
                let cutoffTime = 0;
                if (games.length > 0) {
                    // The Xth most recent game's creationDate is the cutoff
                    cutoffTime = games[games.length - 1].creationDate;
                }
                // Get actions for this user
                const userActions = await getUserActions(dbUser.id);
                // Count failed accepts since cutoffTime
                failedAccepts = userActions.filter((action: ActionInt) =>
                    action.action === Actions.AcceptFail && action.time >= cutoffTime
                ).length;
                timeBold = `**Last ${gamesCount} games**`;
            } else if (days) {
                // Calculate the timestamp for X days ago
                const cutoffTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
                // Query games within the time period where the user participated
                const games = await GameModel.find({
                    users: dbUser._id,
                    creationDate: { $gte: cutoffTime },
                    scoreB: { $gte: 0 },
                    scoreA: { $gte: 0 }
                });
                totalGames = games.length;
                // Query actions within the time period
                const userActions = await getUserActions(dbUser.id);
                failedAccepts = userActions.filter((action: ActionInt) =>
                    action.action === Actions.AcceptFail && action.time >= cutoffTime
                ).length;
                timeBold = `**Last ${days} days**`;
            } else {
                // Use the original behavior (all time)
                const stats = await getStats(dbUser._id, "SND");
                const userActions = await getUserActions(dbUser.id);
                totalGames = stats.gamesPlayed;
                failedAccepts = userActions.filter((action: ActionInt) => action.action === Actions.AcceptFail).length;
                timeBold = "All time";
            }

            const ratio = totalGames > 0 ? (failedAccepts / totalGames * 100).toFixed(2) : "0.00";

            let userDisplay = interaction.options.getUser('user', true).username;
            await interaction.reply({
                content: `**Fail to Accept Ratio for ${userDisplay}**\n` +
                    `${timeBold}\n` +
                    `Total Games Played: ${totalGames}\n` +
                    `Total Failed Accepts: ${failedAccepts}\n` +
                    `Current Counter: ${dbUser.banCounterFail}\n` +
                    `Ratio: ${ratio}%`
            });

            //log the cmd
            let logMessage = `<@${interaction.user.id}> used fail_to_accept_ratio for <@${user.id}>.`;
            let modAction = `<@${interaction.user.id}> used fail_to_accept_ratio`;
            await logModInfo(logMessage, interaction.client, modAction);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'fail_to_accept_ratio',
    allowedRoles: tokens.Mods,
} 
