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
            
            // Fetch the latest 10 actions and warnings
            const actions = await ActionModel.find({ userId: user.id }).sort({ time: -1 }).limit(10);
            const warnings = await WarnModel.find({ userId: dbUser._id }).sort({ timeStamp: -1 }).limit(10);
            
            // Combine actions and warnings into a single array
            const allItems = [...actions, ...warnings];
            
            // Sort the combined array chronologically (descending order)
            allItems.sort((a, b) => (b.time || b.timeStamp) - (a.time || a.timeStamp));
            
            // Prepare the embed content
            const embedContent = latestItems.map(item => {
              if (item.time) { // Action
                return ActionEmbed(item, dbUser);
              } else { // Warning
                return warningEmbeds(user, item);
              }
            });
            
            await interaction.reply({
              ephemeral: visible,
              content: `Showing the latest 20 actions and warnings for ${user.username}`,
              embeds: embedContent,
            });            
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "actions",
    allowedRoles: tokens.Mods,
}
