import { SubCommand } from "../../interfaces/Command";
import { userOption } from "../../utility/options";
import tokens from "../../tokens";
import { logError } from "../../loggers";
import { getUserByUser } from "../../modules/getters/getUser";
import { getStats } from "../../modules/getters/getStats";
import { getUserActions } from "../../modules/getters/getAction";
import { Actions, ActionInt } from "../../database/models/ActionModel";
import { SlashCommandSubcommandBuilder } from "discord.js";

export const failToAcceptRatio: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('fail_to_accept_ratio')
        .setDescription('Get the ratio of failed accepts to total games played for a user')
        .addUserOption(userOption('User to check fail to accept ratio for')),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            const stats = await getStats(dbUser._id, "SND");
            const userActions = await getUserActions(dbUser.id);
            
            const totalGames = stats.gamesPlayed;
            const failedAccepts = userActions.filter((action: ActionInt) => action.action === Actions.AcceptFail).length;
            const ratio = totalGames > 0 ? (failedAccepts / totalGames * 100).toFixed(2) : "0.00";
            
            await interaction.reply({
                content: `**Fail to Accept Ratio for <@${dbUser.id}>**\n` +
                        `Total Games Played: ${totalGames}\n` +
                        `Total Failed Accepts (Historical): ${failedAccepts}\n` +
                        `Current Counter: ${dbUser.banCounterFail}\n` +
                        `Ratio: ${ratio}%`
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'fail_to_accept_ratio',
    allowedRoles: tokens.Mods,
} 
