import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import {getUserByUser} from "../../modules/getters/getUser";
import ActionModel from "../../database/models/ActionModel";
import {ActionEmbed} from "../../embeds/ModEmbeds";
import WarnModel from "../../database/models/WarnModel";
import {warningEmbeds} from "../../embeds/statsEmbed";

export const actions: Command = {
    data: new SlashCommandBuilder()
        .setName("actions")
        .setDescription("Displays actions against a user")
        .addUserOption(userOption("User to view actions for")),
    run: async (interaction) => {
        try {
            const user = interaction.options.getUser("user", true)
            const actions = await ActionModel.find({userId: user.id});
            const dbUser = await getUserByUser(user);
            const warnings = await WarnModel.find({userId: dbUser._id});
            await interaction.reply({ephemeral: true, content: `Showing actions for <@${user.id}>`, embeds: [ActionEmbed(actions, dbUser), warningEmbeds(user, warnings)]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "actions",
    allowedRoles: [tokens.ModRole],
}