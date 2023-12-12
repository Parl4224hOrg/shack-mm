import {Command} from "../../interfaces/Command";
import {SlashCommandStringOption} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import warnModel from "../../database/models/WarnModel";
import moment from "moment";
import tokens from "../../tokens";

export const warn: Command = {
    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Warns a player")
        .addUserOption(userOption("User to warn"))
        .addStringOption(new SlashCommandStringOption()
            .setName("reason")
            .setDescription("Reason for the warning")
            .setRequired(true)),
    run: async (interaction) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true));
            await warnModel.create({
                userId: dbUser._id,
                reason: interaction.options.getString('reason', true),
                timeStamp: moment().unix(),
                modId: interaction.user.id,
                removed: false,
            });
            await interaction.reply({content: `<@${interaction.options.getUser('user', true).id}> has been warned:\n\`\`\`${interaction.options.getString('reason', true)}\`\`\``});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'warn',
    allowedRoles: [tokens.ModRole]
}