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
            const user = interaction.options.getUser("user", true)
            const actions = await ActionModel.find({userId: user.id})
                                             .sort({createdAt: -1})
                                             .limit(10);
            const dbUser = await getUserByUser(user, data);
            const warnings = await WarnModel.find({userId: dbUser._id})
                                            .sort({createdAt: -1})
                                            .limit(10); // Fetch latest 10 warnings
            const visible = interaction.options.getBoolean('hidden') ?? false;
            await interaction.reply({ephemeral: visible, content: `Showing last 10 actions and warnings for ${user.username}`, embeds: [ActionEmbed(actions, dbUser), warningEmbeds(user, warnings)]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "actions",
    allowedRoles: tokens.Mods,
}
