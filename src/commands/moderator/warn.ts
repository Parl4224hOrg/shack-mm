import { ChannelType } from "discord.js";
import {SubCommand} from "../../interfaces/Command";
import {SlashCommandStringOption, SlashCommandSubcommandBuilder} from "discord.js";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import warnModel from "../../database/models/WarnModel";
import moment from "moment";
import tokens from "../../tokens";
import {EmbedBuilder, TextChannel} from "discord.js";

export const warn: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("warn")
        .setDescription("Warns a player")
        .addUserOption(userOption("User to warn"))
        .addStringOption(new SlashCommandStringOption()
            .setName("reason")
            .setDescription("Reason for the warning")
            .setRequired(true)),
    run: async (interaction, data) => {
        try {
            // Check if the command was run under /ref or /mod
            const isReferee = interaction.commandName === 'ref';
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            if (isReferee) {
                await warnModel.create({
                    userId: dbUser._id,
                    reason: interaction.options.getString('reason', true),
                    timeStamp: moment().unix(),
                    modId: 'by Referee',
                    removed: false,
                });
            } else {
                await warnModel.create({
                    userId: dbUser._id,
                    reason: interaction.options.getString('reason', true),
                    timeStamp: moment().unix(),
                    modId: interaction.user.id,
                    removed: false,
                });
            }
            if (interaction.channel?.type === ChannelType.PublicThread ||
                interaction.channel?.type === ChannelType.PrivateThread ||
                interaction.channel?.type === ChannelType.AnnouncementThread) {
                await interaction.reply({ ephemeral: true, content: "Warn is working" });
                await interaction.followUp({content: `<${interaction.options.getUser('user', true).username}> has been warned:\n\`\`\`${interaction.options.getString('reason', true)}\`\`\``});
            } else {
                await interaction.reply({ ephemeral: true, content: "Warn is working" });
                await interaction.followUp({content: `<@${interaction.options.getUser('user', true).id}> has been warned:\n\`\`\`${interaction.options.getString('reason', true)}\`\`\``});
            }
            let channel: TextChannel;
            if (isReferee) {
                channel = await interaction.client.channels.fetch(tokens.RefereeLogChannel) as TextChannel;
            } else { 
                channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
            }
            const embed = new EmbedBuilder();
            embed.setTitle(`User ${dbUser.id} has been warned`);
            embed.setDescription(`<@${interaction.options.getUser('user', true).id}> has been warned:\n\`\`\`${interaction.options.getString('reason', true)}\`\`\` by <@${interaction.user.id}>`);
            await channel.send({embeds: [embed.toJSON()]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'warn',
    allowedRoles: tokens.Mods
}
