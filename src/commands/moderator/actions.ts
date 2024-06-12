import {SubCommand} from "../../interfaces/Command";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import {getUserByUser} from "../../modules/getters/getUser";
import ActionModel from "../../database/models/ActionModel";
import {ActionEmbed} from "../../embeds/ModEmbeds";
import WarnModel from "../../database/models/WarnModel";
import {warningEmbeds} from "../../embeds/statsEmbed";
import {SlashCommandBooleanOption, SlashCommandSubcommandBuilder} from "discord.js";

export const actions: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("actions")
        .setDescription("Displays actions against a user")
        .addUserOption(userOption("User to view actions for"))
        .addBooleanOption(new SlashCommandBooleanOption()
            .setName('hidden')
            .setDescription('if message should be visible')
            .setRequired(false)),
    run: async (interaction, data) => {
        try {
            const user = interaction.options.getUser("user", true);
            const dbUser = await getUserByUser(user, data);
            const visible = interaction.options.getBoolean('hidden') ?? false;

            // Fetch the latest 10 actions
            const actions = await ActionModel.find({
                userId: user.id
            }).sort({ time: -1 }).limit(10);

            // Fetch the latest 10 warnings
            const warnings = await WarnModel.find({
                userId: dbUser._id
            }).sort({ timeStamp: -1 }).limit(10);
            
            // Normalize and combine actions and warnings
            const normalizedActions = actions.map(action => ({
                type: 'action',
                data: action,
                time: action.time
            }));
            const normalizedWarnings = warnings.map(warning => ({
                type: 'warning',
                data: warning,
                time: warning.timeStamp
            }));
            const combined = [...normalizedActions, ...normalizedWarnings]
                .sort((a, b) => b.time - a.time)
                .slice(0, 10);

            // Generate embeds for the combined results
            const embeds = combined.map(item =>
                item.type === 'action'
                    ? ActionEmbed(item.data, dbUser)
                    : warningEmbeds(user, [item.data])
            );

            await interaction.reply({ ephemeral: visible, content: `Showing last 10 actions and warnings for ${user.username}`, embeds });

        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "actions",
    allowedRoles: tokens.Mods,
}
