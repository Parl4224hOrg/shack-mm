import {SubCommand} from "../../interfaces/Command";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {timeOption, timeScales, userOption} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import moment from "moment";
import {updateUser} from "../../modules/updaters/updateUser";
import {grammaticalTime} from "../../utility/grammatical";

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
            switch (interaction.options.getString('time_scale', true)) {
                case 'm': {multiplier = 60} break;
                case 'h': {multiplier = 60 * 60} break;
                case 'd': {multiplier = 60 * 60 * 24} break;
                case 'w': {multiplier = 60 * 60 * 24 * 7} break;
            }
            const time = interaction.options.getNumber('time', true);
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user, data);
            const member = await interaction.guild!.members.fetch(user.id);
            if (time < 0) {
                dbUser.muteUntil = -1;
                await updateUser(dbUser, data);
                await member.roles.add(tokens.MutedRole);
                await interaction.reply({ephemeral: true, content: `<@${user.id}> has been muted indefinitely`});
            } else if (time == 0) {
                dbUser.muteUntil = moment().unix() + time * multiplier;
                await updateUser(dbUser, data);
                await member.roles.remove(tokens.MutedRole);
                await interaction.reply({ephemeral: true, content: `<@${user.id}> has been un-muted`});
            } else {
                dbUser.muteUntil = moment().unix() + time * multiplier;
                await updateUser(dbUser, data);
                await member.roles.add(tokens.MutedRole);
                await interaction.reply({ephemeral: true, content: `<@${user.id}> has been muted for ${grammaticalTime(time * multiplier)}`});
            }
            await warnModel.create({
                userId: dbUser._id,
                reason: interaction.options.getString('reason', true),
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
