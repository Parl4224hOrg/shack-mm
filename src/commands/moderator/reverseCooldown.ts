import { ChannelType } from "discord.js";
import { SubCommand } from "../../interfaces/Command";
import { cdType, reason, userOption } from "../../utility/options";
import tokens from "../../tokens";
import { logError, logSMMInfo } from "../../loggers";
import { createActionUser } from "../../modules/constructors/createAction";
import { Actions } from "../../database/models/ActionModel";
import { getUserByUser } from "../../modules/getters/getUser";
import { updateUser } from "../../modules/updaters/updateUser";
import { SlashCommandSubcommandBuilder } from "discord.js";

export const reverseCooldown: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('reverse_cooldown')
        .setDescription("Reverses a cooldown with changing user's ban counter")
        .addUserOption(userOption('User to reverse cooldown of'))
        .addStringOption(cdType)
        .addStringOption(reason),
    run: async (interaction, data) => {
        try {
            let reason = interaction.options.getString('reason', true);
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user, data);
            if (interaction.options.getString('type', true) == 'abandon') {
                dbUser.banCounterAbandon--;
                dbUser.banUntil = 0;
                if (dbUser.banCounterAbandon < 0) {
                    dbUser.banCounterAbandon = 0;
                }
            } else {
                dbUser.banCounterFail--;
                dbUser.banUntil = 0;
                if (dbUser.banCounterFail < 0) {
                    dbUser.banCounterFail = 0;
                }
            }
            await updateUser(dbUser, data);
            await createActionUser(Actions.ReverseCooldown, interaction.user.id, dbUser.id, interaction.options.getString('reason', true), 'Bot cooldown reversed');
            if (interaction.channel?.type === ChannelType.PublicThread ||
                interaction.channel?.type === ChannelType.PrivateThread ||
                interaction.channel?.type === ChannelType.AnnouncementThread) {
                await interaction.reply({ content: `<${dbUser.id}> cooldown reversed` });
            } else {
                await interaction.reply({ content: `<@${dbUser.id}> cooldown reversed` });
            }

            //log the cmd
            let logMessage = `<@${interaction.user.id}> reversed <@${user.id}>'s cooldown,Reason:${reason}.\nAbandon CD Counter: ${dbUser.banCounterAbandon}, Fail to Accept Counter: ${dbUser.banCounterFail}`;
            let modAction = `<@${interaction.user.id}> used reverse_cooldown`;
            await logSMMInfo(logMessage, interaction.client, modAction);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'reverse_cooldown',
    allowedRoles: tokens.Mods,
}
