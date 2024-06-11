import { Command } from "../../interfaces/Command";
import { SlashCommandBuilder } from "discord.js";
import { userOption } from "../../utility/options";
import tokens from "../../tokens";
import { logError } from "../../loggers";
import { getUserByUser } from "../../modules/getters/getUser";
import { updateUser } from "../../modules/updaters/updateUser";
import {Client, EmbedBuilder, TextChannel} from "discord.js";
import moment from "moment";

export const unmute: Command = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription("Unmutes a player")
        .addUserOption(userOption("User to unmute")),
    run: async (interaction, data) => {
        try {
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user, data);
            const member = await interaction.guild!.members.fetch(user.id);

            dbUser.muteUntil = moment().unix();
            await updateUser(dbUser, data);
            await member.roles.remove(tokens.MutedRole);
            await interaction.reply({ephemeral: true, content: `<@${user.id}> has been un-muted`});
            const channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
            const embed = new EmbedBuilder();
            embed.setTitle(`User <@${user.id}> has been unmuted`);
            embed.setDescription(`Un-muted by <@${interaction.user.id}>`);
            await channel.send({embeds: [embed.toJSON()]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'unmute',
    allowedRoles: [tokens.LeadModRole],
};
