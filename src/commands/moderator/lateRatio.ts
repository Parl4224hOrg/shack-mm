import {SubCommand} from "../../interfaces/Command";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import {getUserByUser} from "../../modules/getters/getUser";
import StatsModel from "../../database/models/StatsModel";
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

            await interaction.reply({ephemeral: visible, content: `${user.username} has played a total of ${totalGames} games.`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "late_ratio",
    allowedRoles: tokens.Mods,
}
