import {SubCommand} from "../../interfaces/Command";
import { SlashCommandSubcommandBuilder, SlashCommandStringOption } from "discord.js";
import {userOption} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import moment from "moment";
import {updateUser} from "../../modules/updaters/updateUser";
import {grammaticalTime} from "../../utility/grammatical";
import warnModel from "../../database/models/WarnModel";
import {Client, EmbedBuilder, TextChannel} from "discord.js";

export const refMute: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('ref_mute')
        .setDescription("Mutes a player for 30 minutes (referee command)")
        .addUserOption(userOption("User to mute"))
        .addStringOption(new SlashCommandStringOption()
            .setName("reason")
            .setDescription("Reason for the mute")
            .setRequired(true)),
    run: async (interaction, data) => {
        try {
            await interaction.deferReply();
            
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user, data);
            const member = await interaction.guild!.members.fetch(user.id);
            let reason = interaction.options.getString('reason', true);
            
            // Check if user is already muted and hasn't expired
            const currentTime = moment().unix();
            if (dbUser.muteUntil === -1) {
                await interaction.followUp({ 
                    ephemeral: true, 
                    content: `<@${user.id}> is permanently muted. No action taken.` 
                });
                return;
            } else if (dbUser.muteUntil > currentTime) {
                const remainingTime = dbUser.muteUntil - currentTime;
                await interaction.followUp({ 
                    ephemeral: true, 
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
            
            const muteMessage = `<@${user.id}> has been muted for ${grammaticalTime(muteDuration)}`;
            reason = `Muted for 30 minutes because: ${reason}`;
            
            await interaction.followUp({ ephemeral: true, content: muteMessage });
            
            await warnModel.create({
                userId: dbUser._id,
                reason: reason,
                timeStamp: moment().unix(),
                modId: 'by Referee',
                removed: false,
            });
            
            // Send to referee log channel
            const channel = await interaction.client.channels.fetch(tokens.RefereeLogChannel) as TextChannel;
            const embed = new EmbedBuilder();
            embed.setTitle(`User ${user.username} has been muted by referee`);
            embed.setDescription(`<@${user.id}> muted by <@${interaction.user.id}> for 30 minutes because: ${reason}`);
            await channel.send({content: `<@&${tokens.ModRole}>`, embeds: [embed.toJSON()]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'ref_mute',
    allowedRoles: tokens.Mods,
} 
