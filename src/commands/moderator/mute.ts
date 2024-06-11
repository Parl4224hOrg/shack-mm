import {SubCommand} from "../../interfaces/Command";
import { SlashCommandSubcommandBuilder, SlashCommandStringOption } from "discord.js";
import {timeOption, timeScales, userOption} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import moment from "moment";
import {updateUser} from "../../modules/updaters/updateUser";
import {grammaticalTime} from "../../utility/grammatical";
import warnModel from "../../database/models/WarnModel";

export const mute: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('mute')
        .setDescription("Mutes a player for a set amount of time or infinite if less than 0")
        .addUserOption(userOption("User to mute"))
        .addStringOption(timeScales)
        .addNumberOption(timeOption)
        .addStringOption(new SlashCommandStringOption()
            .setName("reason")
            .setDescription("Reason for the warning")
            .setRequired(true)),
    run: async (interaction, data) => {
        try {
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
            let reason = interaction.options.getString('reason', true);
            let muteDuration = time * multiplier;
            let muteMessage = '';
            
            if (time < 0) {
                dbUser.muteUntil = -1;
                await updateUser(dbUser, data);
                await member.roles.add(tokens.MutedRole);
                reason = `Muted indefinitely because: ${reason}`;
                await interaction.reply({ephemeral: true, content: `<@${user.id}> has been muted indefinitely`});
            } else if (time == 0) {
                dbUser.muteUntil = moment().unix() + time * multiplier;
                await updateUser(dbUser, data);
                await member.roles.remove(tokens.MutedRole);
                reason = `Un-muted because: ${reason}`;
                await interaction.reply({ephemeral: true, content: `<@${user.id}> has been un-muted`});
            } else {
                dbUser.muteUntil = moment().unix() + time * multiplier;
                await updateUser(dbUser, data);
                await member.roles.add(tokens.MutedRole);
                muteMessage = `<@${user.id}> has been muted for ${grammaticalTime(muteDuration)}`;
                reason = `Muted for ${time} ${durationText} because: ${reason}`;
                await interaction.reply({ ephemeral: true, content: muteMessage });
            }
            await warnModel.create({
                userId: dbUser._id,
                reason: reason,
                timeStamp: moment().unix(),
                modId: interaction.user.id,
                removed: false,
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'mute',
    allowedRoles: tokens.Mods,
}
