import {SubCommand} from "../../interfaces/Command";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import {getUserByUser} from "../../modules/getters/getUser";
import StatsModel from "../../database/models/StatsModel";
import WarnModel from "../../database/models/WarnModel";
import {SlashCommandBooleanOption, SlashCommandSubcommandBuilder} from "discord.js";

export const lateRatio: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("late_ratio")
        .setDescription("Displays the total number of games a user has played")
        .addUserOption(userOption("User to view game stats for"))
        .addBooleanOption(new SlashCommandBooleanOption()
            .setName('hidden')
            .setDescription('if message should be visible')
            .setRequired(false)),
    run: async (interaction, data) => {
        try {
            const user = interaction.options.getUser("user", true);
            const dbUser = await getUserByUser(user, data);
            const visible = interaction.options.getBoolean('hidden') ?? false;

            // Fetch the user's game statistics
            const stats = await StatsModel.findOne({
                userId: dbUser._id
            });

            if (!stats) {
                await interaction.reply({ephemeral: visible, content: `No game stats found for ${user.username}`});
                return;
            }

            const totalGames = stats.gamesPlayed;

            // Fetch all warnings that contain the word "late"
            const warnings = await WarnModel.find({
                userId: dbUser._id,
                reason: { $regex: /late/i }
            }).sort({ timeStamp: -1 });

            if (!warnings.length) {
                await interaction.reply({ephemeral: visible, content: `No warnings found for ${user.username} containing the word "late".`});
                return;
            }

            const totalLates = warnings.length;
            
            // Calculate the ratio of lates to games
            const lateRatio = totalGames > 0 ? (totalLates / totalGames).toFixed(2) : "N/A";

            await interaction.reply({
                ephemeral: visible,
                content: `${user.username} has a late-to-games ratio of ${lateRatio}. (${totalLates} lates / ${totalGames} games)`
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "late_ratio",
    allowedRoles: tokens.Mods,
}
