import {SubCommand} from "../../interfaces/Command";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import ActionModel from "../../database/models/ActionModel";
import {ActionEmbed} from "../../embeds/ModEmbeds";
import {MessageFlagsBitField, SlashCommandBooleanOption, SlashCommandSubcommandBuilder} from "discord.js";
import {getUserByUser} from "../../modules/getters/getUser";

function chunk<T>(array: T[], size = 20): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

export const moderatorActions: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("moderator_actions")
        .setDescription("Shows last 20 moderator infractions (not warnings) for a user, excluding those by Shack MM Bot.")
        .addUserOption(userOption("User to view infractions for"))
        .addBooleanOption(new SlashCommandBooleanOption()
            .setName('hidden')
            .setDescription('if message should be visible')
            .setRequired(false)),
    run: async (interaction, data) => {
        try {
            const user = interaction.options.getUser("user", true);
            const dbUser = await getUserByUser(user, data);
            const visible = interaction.options.getBoolean('hidden') ? MessageFlagsBitField.Flags.Ephemeral : undefined;
            const shackBotId = '1058875839296577586';
            // Only fetch actions for this user, not by the bot
            const actions = await ActionModel.find({
                userId: user.id,
                modId: { $ne: shackBotId }
            }).sort({ time: -1 });

            const chunks = chunk(actions, 20);

            await interaction.reply({flags: visible, content: `Showing last 20 moderator infractions (not warnings) for ${user.username}`, embeds: chunks.map(chunk => ActionEmbed(chunk, dbUser))});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "moderator_actions",
    allowedRoles: tokens.Mods,
} 
