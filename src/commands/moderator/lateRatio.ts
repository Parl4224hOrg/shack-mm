import {SubCommand} from "../../interfaces/Command";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import {getUserByUser} from "../../modules/getters/getUser";
import {SlashCommandBooleanOption, SlashCommandSubcommandBuilder} from "discord.js";
import LateModel from "../../database/models/LateModel";

export const lateRatio: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("late_ratio")
        .setDescription("Displays the total number of games a user has played")
        .addUserOption(userOption("User to view late stats for"))
        .addBooleanOption(new SlashCommandBooleanOption()
            .setName('hidden')
            .setDescription('if message should be visible')
            .setRequired(false)),
    run: async (interaction, data) => {
        try {
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user, data);
            const lates = await LateModel.find({user: dbUser.id});
            let totalTime = 0;
            for (const late of lates) {
                // Subtract 60 seconds times 5 minutes to account for allowed join time
                totalTime += (late.joinTime - late.channelGenTime) - 5 * 60;
            }
            const avgLateTime = totalTime / lates.length;
            const latePercent = (lates.length / (dbUser.gamesPlayedSinceLates + 1)) * 100;
            const latePercentNeeded = 53.868 * Math.exp(-0.00402 * avgLateTime);
            const ephemeral = interaction.options.getBoolean("hidden") ?? false;
            await interaction.reply({ephemeral: ephemeral,
                content: `${user.username} is late ${latePercent.toFixed(2)}% by an average of ${avgLateTime.toFixed(2)} seconds. They need to be late ${latePercentNeeded.toFixed(2)}% to receive a cooldown.`
            })
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "late_ratio",
    allowedRoles: tokens.Mods,
}
