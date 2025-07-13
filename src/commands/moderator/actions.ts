import {SubCommand} from "../../interfaces/Command";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import {getUserByUser} from "../../modules/getters/getUser";
import ActionModel from "../../database/models/ActionModel";
import {ActionEmbed} from "../../embeds/ModEmbeds";
import WarnModel from "../../database/models/WarnModel";
import {warningEmbeds} from "../../embeds/statsEmbed";
import {MessageFlagsBitField, SlashCommandBooleanOption, SlashCommandSubcommandBuilder} from "discord.js";

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
            const visible = interaction.options.getBoolean('hidden') ? MessageFlagsBitField.Flags.Ephemeral : undefined;

            // Fetch the latest 10 actions
            const actions = await ActionModel.find({
                userId: user.id
            }).sort({ time: -1 }).limit(10);

            // Fetch the latest 10 warnings that do not contain the words "bot late"
            const warnings = await WarnModel.find({
                userId: dbUser._id,
                reason: { $not: /bot late/i }
            }).sort({ timeStamp: -1 }).limit(10);
                        
            await interaction.reply({flags: visible, content: `Showing actions for ${user.username}`, embeds: [ActionEmbed(actions, dbUser), warningEmbeds(user, warnings)]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "actions",
    allowedRoles: tokens.Mods,
}
