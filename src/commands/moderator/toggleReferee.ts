import {SubCommand} from "../../interfaces/Command";
import {SlashCommandBooleanOption, SlashCommandSubcommandBuilder} from "discord.js";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import {getUserByUser} from "../../modules/getters/getUser";
import {updateUser} from "../../modules/updaters/updateUser";
import {EmbedBuilder, TextChannel} from "discord.js";

export const toggleReferee: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('toggle_referee')
        .setDescription('Toggles whether a user is a referee or not')
        .addUserOption(userOption("User to toggle status of"))
        .addBooleanOption(new SlashCommandBooleanOption()
            .setName('is_ref')
            .setDescription('Whether the user should be made a ref or have it removed')
            .setRequired(true)),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            dbUser.referee = interaction.options.getBoolean('is_ref', true);
            await updateUser(dbUser, data);
            await interaction.reply({ephemeral: true, content: `<@${dbUser.id}> ${dbUser.referee ? "is now" : "is no longer"} a referee.`});
            const channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
            const embed = new EmbedBuilder();
            embed.setTitle(`User ${dbUser.id} referee toggle`);
            embed.setDescription(`<@${dbUser.id}> ${dbUser.referee ? "is now" : "is no longer"} a referee by <@${interaction.user.id}>`);
            await channel.send({embeds: [embed.toJSON()]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'toggle_referee',
    allowedRoles: tokens.Mods,
}
