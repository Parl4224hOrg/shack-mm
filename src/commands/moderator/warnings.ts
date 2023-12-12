import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import WarnModel from "../../database/models/WarnModel";
import {warningEmbeds} from "../../embeds/statsEmbed";

export const warnings: Command = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription("View a user's warnings")
        .addUserOption(userOption("User to view warnings of")),
    run: async (interaction) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true));
            const warnings = await WarnModel.find({userId: dbUser._id});
            await interaction.reply({content: "Displaying Warnings", embeds: [warningEmbeds(interaction.options.getUser('user', true), warnings)]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "warnings",
}