import { Command } from "../../interfaces/Command";
import {MessageFlagsBitField, SlashCommandBuilder} from "discord.js";
import { userOption } from "../../utility/options";
import tokens from "../../tokens";
import {logError, logInfo} from "../../loggers";
import { getUserByUser } from "../../modules/getters/getUser";
import { updateUser } from "../../modules/updaters/updateUser";
import {EmbedBuilder, TextChannel} from "discord.js";
import moment from "moment";
import Tokens from "../../tokens";

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
            await member.roles.remove(tokens.MutedRole, "Remove using /unmute");
            await logInfo(`Unmuted ${member.user.tag} (${user.id}) unmute.ts ln 25`, interaction.client, [Tokens.Parl]);
            await interaction.reply({content: `<@${user.id}> has been un-muted`});
            const channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
            const embed = new EmbedBuilder();
            embed.setTitle(`User ${user.id} has been unmuted`);
            embed.setDescription(`<@${user.id}> un-muted by <@${interaction.user.id}>`);
            await channel.send({embeds: [embed.toJSON()]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'unmute',
    allowedRoles: [tokens.LeadModRole],
};
