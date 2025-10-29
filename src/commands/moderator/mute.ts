import {SubCommand} from "../../interfaces/Command";
import {SlashCommandSubcommandBuilder, SlashCommandStringOption, MessageFlagsBitField} from "discord.js";
import {timeOption, timeScales, userOption} from "../../utility/options";
import tokens from "../../tokens";
import {logError, logInfo} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import moment from "moment";
import {updateUser} from "../../modules/updaters/updateUser";
import {grammaticalTime} from "../../utility/grammatical";
import warnModel from "../../database/models/WarnModel";
import {EmbedBuilder, TextChannel} from "discord.js";

export const mute: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('mute')
        .setDescription("Mutes a player and sets timer for appeal or infinite if less than 0, 0 to unmute")
        .addUserOption(userOption("User to mute"))
        .addStringOption(timeScales)
        .addNumberOption(timeOption)
        .addStringOption(new SlashCommandStringOption()
            .setName("reason")
            .setDescription("Reason for the warning")
            .setRequired(true)),
    run: async (interaction, data) => {
        try {
            await interaction.deferReply();
            let multiplier: number = 0;
            let durationText: string = '';
            switch (interaction.options.getString('time_scale', true)) {
                case 'm': { multiplier = 60; durationText = 'minutes'; } break;
                case 'h': { multiplier = 60 * 60; durationText = 'hours'; } break;
                case 'd': { multiplier = 60 * 60 * 24; durationText = 'days'; } break;
                case 'w': { multiplier = 60 * 60 * 24 * 7; durationText = 'weeks'; } break;
            }
            const time = interaction.options.getNumber('time', true);
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user, data);
            const member = await interaction.guild!.members.fetch(user.id);
            const reason = interaction.options.getString('reason', true);
            let muteDuration = time * multiplier;
            let muteMessage = '';
            
            if (time < 0) {
                dbUser.muteUntil = -1;
                await updateUser(dbUser, data);
                await member.roles.add(tokens.MutedRole);
                
                await interaction.followUp({flags: MessageFlagsBitField.Flags.Ephemeral, content: `<@${user.id}> has been muted indefinitely`});
                await user.send(`You have been muted indefinitely because: ${reason}`); // Send DM
                await warnModel.create({
                    userId: dbUser._id,
                    reason: reason,
                    timeStamp: moment().unix(),
                    modId: interaction.user.id,
                    removed: false,
                });
            } else if (time == 0) {
                dbUser.muteUntil = moment().unix() + time * multiplier;
                await updateUser(dbUser, data);
                await member.roles.remove(tokens.MutedRole, "remove using /mute");
                await logInfo(`Unmuted ${member.user.tag} (${user.id}) mute.ts ln 61`, interaction.client);
                reason = `Un-muted because: ${reason}`;
                const channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
                const embed = new EmbedBuilder();
                embed.setTitle(`User ${user.username} has been unmuted`);
                embed.setDescription(`<@${user.id}> un-muted by <@${interaction.user.id}> because: ${reason}`);
                await channel.send({embeds: [embed.toJSON()]});

                await interaction.followUp({flags: MessageFlagsBitField.Flags.Ephemeral, content: `<@${user.id}> has been un-muted`});
                await user.send(`You have been un-muted because: ${reason}`); // Send DM
            } else {
                dbUser.muteUntil = moment().unix() + time * multiplier;
                await updateUser(dbUser, data);
                await member.roles.add(tokens.MutedRole);

                const channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
                const embed = new EmbedBuilder();
                embed.setTitle(`User ${user.username} has been muted`);
                embed.setDescription(`<@${user.id}> muted by <@${interaction.user.id}> because: ${reason}`);
                await channel.send({embeds: [embed.toJSON()]});

                muteMessage = `<@${user.id}> has been muted, make a ticket in ${grammaticalTime(muteDuration)} to appeal`;
                await interaction.followUp({ flags: MessageFlagsBitField.Flags.Ephemeral, content: muteMessage });
                await user.send(`You have been muted, make a ticket to appeal in ${time} ${durationText}\nReason: ${reason}`); // Send DM
                await warnModel.create({
                    userId: dbUser._id,
                    reason: reason,
                    timeStamp: moment().unix(),
                    modId: interaction.user.id,
                    removed: false,
                });
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'mute',
    allowedRoles: tokens.Mods,
}
