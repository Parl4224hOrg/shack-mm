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
            
            allItems.sort((a, b) => {
                // Check for existence of properties in descending order (latest first)
                const timeA = a.time;
                const timeB = b.time;
                if (timeB !== undefined) {
                    return timeA === undefined ? 1 : timeB - timeA;
                } else {
                const timeStampA = a.timeStamp;
                const timeStampB = b.timeStamp;
                return timeStampB === undefined ? 1 : timeStampB - timeStampA;
              }
            });
            
            // Prepare the embed content
            const embedContent = allItems.map(item => {
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
