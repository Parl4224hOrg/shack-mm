import { SubCommand } from "../../interfaces/Command";
import { userOption } from "../../utility/options";
import { logError, logSMMInfo } from "../../loggers";
import { getUserByUser } from "../../modules/getters/getUser";
import WarnModel from "../../database/models/WarnModel";
import { warningEmbeds } from "../../embeds/statsEmbed";
import tokens from "../../tokens";
import { SlashCommandSubcommandBuilder } from "discord.js";

export const warnings: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('warnings')
        .setDescription("View a user's warnings")
        .addUserOption(userOption("User to view warnings of")),
    run: async (interaction, data) => {
        try {
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user, data);
            const warnings = await WarnModel.find({ userId: dbUser._id });
            await interaction.reply({ content: "Displaying Warnings", embeds: [warningEmbeds(interaction.options.getUser('user', true), warnings)] });

            //log the cmd
            let logMessage = `<@${interaction.user.id}> checked warnings for <@${user.id}>`;
            let modAction = `${interaction.user.displayName} used warnings`;
            await logSMMInfo(logMessage, interaction.client, modAction);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "warnings",
    allowedRoles: tokens.Mods,
}