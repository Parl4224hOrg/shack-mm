import {SubCommand} from "../../interfaces/Command";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import {getUserByUser} from "../../modules/getters/getUser";
import WarnModel from "../../database/models/WarnModel";
import {warningEmbeds} from "../../embeds/statsEmbed";
import {MessageFlagsBitField, SlashCommandBooleanOption, SlashCommandSubcommandBuilder} from "discord.js";

export const lates: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("lates")
        .setDescription("Displays the last 20 warnings containing the word 'late'")
        .addUserOption(userOption("User to view warnings for"))
        .addBooleanOption(new SlashCommandBooleanOption()
            .setName('hidden')
            .setDescription('if message should be visible')
            .setRequired(false)),
    run: async (interaction, data) => {
        try {
            const user = interaction.options.getUser("user", true);
            const dbUser = await getUserByUser(user, data);
            const visible = interaction.options.getBoolean('hidden') ? MessageFlagsBitField.Flags.Ephemeral : undefined;

            // Fetch the latest 20 warnings that contain the word "late"
            const warnings = await WarnModel.find({
                userId: dbUser._id,
                reason: { $regex: /late/i }
            }).sort({ timeStamp: -1 }).limit(20);
            
            await interaction.reply({flags: visible, content: `Showing warnings for ${user.username}`, embeds: [warningEmbeds(user, warnings)]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "lates",
    allowedRoles: tokens.Mods,
}
