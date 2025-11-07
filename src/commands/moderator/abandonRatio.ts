import { SubCommand } from "../../interfaces/Command";
import { userOption } from "../../utility/options";
import tokens from "../../tokens";
import { logError } from "../../loggers";
import { getUserByUser } from "../../modules/getters/getUser";
import { getStats } from "../../modules/getters/getStats";
import { getUserActions } from "../../modules/getters/getAction";
import { Actions, ActionInt } from "../../database/models/ActionModel";
import GameModel from "../../database/models/GameModel";
import { SlashCommandSubcommandBuilder, SlashCommandIntegerOption } from "discord.js";

export const abandonRatio: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('abandon_ratio')
        .setDescription('Get the ratio of abandons and force abandons to total games played for a user')
        .addUserOption(userOption('User to check abandon ratio for'))
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
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            const gamesCount = interaction.options.getInteger('games', false);
            const days = interaction.options.getInteger('days', false);

            let totalGames: number;
            let abandons: number;
            let forceAbandons: number;
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
                // Count abandons and force abandons since cutoffTime
                abandons = userActions.filter((action: ActionInt) =>
                    action.action === Actions.Abandon && action.time >= cutoffTime
                ).length;
                forceAbandons = userActions.filter((action: ActionInt) =>
                    action.action === Actions.ForceAbandon && action.time >= cutoffTime
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
                abandons = userActions.filter((action: ActionInt) =>
                    action.action === Actions.Abandon && action.time >= cutoffTime
                ).length;
                forceAbandons = userActions.filter((action: ActionInt) =>
                    action.action === Actions.ForceAbandon && action.time >= cutoffTime
                ).length;
                timeBold = `**Last ${days} days**`;
            } else {
                // Use the original behavior (all time)
                const stats = await getStats(dbUser._id, "SND");
                const userActions = await getUserActions(dbUser.id);
                totalGames = stats.gamesPlayed;
                abandons = userActions.filter((action: ActionInt) => action.action === Actions.Abandon).length;
                forceAbandons = userActions.filter((action: ActionInt) => action.action === Actions.ForceAbandon).length;
                timeBold = "All time";
            }

            const totalAbandons = abandons + forceAbandons;
            const ratio = totalGames > 0 ? (totalAbandons / totalGames * 100).toFixed(2) : "0.00";

            let userDisplay = interaction.options.getUser('user', true).username;
            await interaction.reply({
                content: `**Abandon Ratio for ${userDisplay}**\n` +
                        `${timeBold}\n` +
                        `Total Games Played: ${totalGames}\n` +
                        `Abandons: ${abandons}\n` +
                        `Force Abandons: ${forceAbandons}\n` +
                        `Total Abandons: ${totalAbandons}\n` +
                        `Current Abandon (CD) Counter: ${dbUser.banCounterAbandon}\n` +
                        `Ratio: ${ratio}%`
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'abandon_ratio',
    allowedRoles: tokens.Mods,
} 
