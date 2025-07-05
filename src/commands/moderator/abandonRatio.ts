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
            option.setName('days')
                .setDescription('Only count games and actions within this many days (optional)')
                .setRequired(false)
                .setMinValue(1)
        ),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            const days = interaction.options.getInteger('days', false);
            
            let totalGames: number;
            let abandons: number;
            let forceAbandons: number;
            
            if (days) {
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
            } else {
                // Use the original behavior
                const stats = await getStats(dbUser._id, "SND");
                const userActions = await getUserActions(dbUser.id);
                
                totalGames = stats.gamesPlayed;
                abandons = userActions.filter((action: ActionInt) => action.action === Actions.Abandon).length;
                forceAbandons = userActions.filter((action: ActionInt) => action.action === Actions.ForceAbandon).length;
            }
            
            const totalAbandons = abandons + forceAbandons;
            const ratio = totalGames > 0 ? (totalAbandons / totalGames * 100).toFixed(2) : "0.00";
            const timeBold = days ? `**Last ${days} days**` : "All time";
            
            await interaction.reply({
                content: `**Abandon Ratio for <@${dbUser.id}>**\n` +
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
