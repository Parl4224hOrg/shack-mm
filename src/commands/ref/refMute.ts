import { SubCommand } from "../../interfaces/Command";
import { SlashCommandSubcommandBuilder, SlashCommandStringOption, MessageFlagsBitField } from "discord.js";
import { userOption } from "../../utility/options";
import tokens from "../../tokens";
import { logError, logSMMInfo } from "../../loggers";
import { getUserByUser } from "../../modules/getters/getUser";
import moment from "moment";
import { updateUser } from "../../modules/updaters/updateUser";
import { grammaticalTime } from "../../utility/grammatical";
import warnModel from "../../database/models/WarnModel";

export const refMute: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('ref_mute')
        .setDescription("Mutes a player (referee command)")
        .addUserOption(userOption("User to mute"))
        .addStringOption(new SlashCommandStringOption()
            .setName("reason")
            .setDescription("Reason for the mute")
            .setRequired(true)),
    run: async (interaction, data) => {
        try {
            const isReferee = true;
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user, data);
            const member = await interaction.guild!.members.fetch(user.id);
            let reason = interaction.options.getString('reason', true);

            // Check if user is already muted and hasn't expired
            const currentTime = moment().unix();
            if (dbUser.muteUntil === -1) {
                await interaction.reply({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "Ref mute is working" });
                await interaction.followUp({
                    content: `<@${user.id}> is permanently muted. No action taken.`
                });
                return;
            } else if (dbUser.muteUntil > currentTime) {
                const remainingTime = dbUser.muteUntil - currentTime;
                await interaction.reply({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "Ref mute is working" });
                await interaction.followUp({
                    content: `<@${user.id}> is already muted for ${grammaticalTime(remainingTime)}. No action taken.`
                });
                return;
            }

            // Fixed 30 minute mute for refs
            const multiplier = 60; // minutes
            const time = 30; // 30 minutes
            const muteDuration = time * multiplier;

            dbUser.muteUntil = moment().unix() + muteDuration;
            await updateUser(dbUser, data);
            await member.roles.add(tokens.MutedRole);

            const muteMessage = `<@${user.id}> has been muted, appeal in ${grammaticalTime(muteDuration)}`;
            reason = `Muted for 30 minutes because: ${reason}`;

            let followUpMessage = null;

            await interaction.reply({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "Ref mute is working" });
            if (interaction.channel && interaction.channel.isSendable()) {
                followUpMessage = await interaction.channel.send({
                    content: muteMessage,
                    allowedMentions: { users: [user.id] }
                })
            } else {
                await interaction.followUp({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "cannot send message, command executed" });
            }

            await warnModel.create({
                userId: dbUser._id,
                reason: reason,
                timeStamp: moment().unix(),
                modId: 'by Referee',
                removed: false,
            });

            //log the cmd
            let logMessage = `<@${interaction.user.id}> muted <@${user.id}>. Reason: ${interaction.options.getString('reason', true)}.`;
            let modAction = `<@${interaction.user.id}> used ref_warn`;
            await logSMMInfo(logMessage, interaction.client, modAction, isReferee);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'ref_mute',
    allowedRoles: tokens.Mods,
} 
