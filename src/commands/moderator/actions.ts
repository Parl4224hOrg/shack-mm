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
            }).sort({ timestamp: -1 }).limit(10);

            // Combine actions and warnings and sort by createdAt
            const combined = [...actions, ...warnings].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);

            // Generate embeds for the combined results
            const actionEmbeds = combined.map(item => item instanceof ActionModel ? ActionEmbed(item, dbUser) : warningEmbeds(user, [item]));

            await interaction.reply({ ephemeral: visible, content: `Showing last 10 actions and warnings for ${user.username}`, embeds: actionEmbeds });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "actions",
    allowedRoles: tokens.Mods,
}
