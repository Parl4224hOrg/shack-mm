import { ChannelType, DMChannel, MessageFlagsBitField } from "discord.js";
import { SubCommand } from "../../interfaces/Command";
import { SlashCommandStringOption, SlashCommandSubcommandBuilder } from "discord.js";
import { userOption } from "../../utility/options";
import { logError, logSMMInfo } from "../../loggers";
import { getUserByUser } from "../../modules/getters/getUser";
import warnModel from "../../database/models/WarnModel";
import moment from "moment";
import tokens from "../../tokens";

export const refWarn: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("ref_warn")
        .setDescription("Warns a player")
        .addUserOption(userOption("User to warn"))
        .addStringOption(new SlashCommandStringOption()
            .setName("reason")
            .setDescription("Reason for the warning")
            .setRequired(true)),
    run: async (interaction, data) => {
        try {
            // Check if the command was run under /ref or /mod
            const isReferee = true;
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user, data);
            await warnModel.create({
                userId: dbUser._id,
                reason: interaction.options.getString('reason', true),
                timeStamp: moment().unix(),
                modId: 'by Referee',
                removed: false,
            });

            if (interaction.channel?.type === ChannelType.PublicThread ||
                interaction.channel?.type === ChannelType.PrivateThread ||
                interaction.channel?.type === ChannelType.AnnouncementThread) {
                await interaction.reply({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "Warn is working" });
                if (interaction.channel && interaction.channel.isSendable()) {
                    await interaction.channel.send({
                        content: `<${interaction.options.getUser('user', true).username}> has been warned:\n\`\`\`${interaction.options.getString('reason', true)}\`\`\``,
                    })
                } else {
                    await interaction.followUp({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "cannot send message, command executed" });
                }
            } else {
                await interaction.reply({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "Warn is working" });
                if (interaction.channel && interaction.channel.isSendable()) {
                    await interaction.channel.send({
                        content: `<@${interaction.options.getUser('user', true).id}> has been warned:\n\`\`\`${interaction.options.getString('reason', true)}\`\`\``,
                        allowedMentions: { users: [interaction.options.getUser('user', true).id] }
                    })
                } else {
                    await interaction.followUp({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "cannot send message, command executed" });
                }
            }
            try {
                let dmChannel: DMChannel;
                if (!user.dmChannel) {
                    dmChannel = await user.createDM(true);
                } else {
                    dmChannel = user.dmChannel;
                }

                await dmChannel.send({ content: `You have received the following warning:\n\`\`\`${interaction.options.getString('reason', true)}\`\`\`` });
            } catch (e) {
                await interaction.followUp({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "Failed to send dm" });
            }

            //log the cmd
            let logMessage = `<@${interaction.user.id}> warned <@${user.id}>. Reason: ${interaction.options.getString('reason', true)}.`;
            let modAction = `<@${interaction.user.id}> used warn`;
            await logSMMInfo(logMessage, interaction.client, modAction, isReferee);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'warn',
    allowedRoles: tokens.Mods
}
