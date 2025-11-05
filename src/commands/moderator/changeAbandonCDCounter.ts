import { ChannelType, DMChannel, MessageFlagsBitField } from "discord.js";
import { SubCommand } from "../../interfaces/Command";
import { userOption, reason } from "../../utility/options";
import tokens from "../../tokens";
import { logError, logSMMInfo } from "../../loggers";
import { createActionUser } from "../../modules/constructors/createAction";
import { Actions } from "../../database/models/ActionModel";
import { getUserByUser } from "../../modules/getters/getUser";
import { updateUser } from "../../modules/updaters/updateUser";
import { SlashCommandSubcommandBuilder, SlashCommandIntegerOption } from "discord.js";

export const changeAbandonCDCounter: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('change_abandon_cd_counter')
        .setDescription('Change a user\'s abandon (CD) counter by a given amount')
        .addUserOption(userOption('User to modify abandon (CD) counter for'))
        .addIntegerOption((option: SlashCommandIntegerOption) =>
            option.setName('delta')
                .setDescription('Amount to change the abandon (CD) counter by (can be negative)')
                .setRequired(true)
        )
        .addStringOption(reason),
    run: async (interaction, data) => {
        try {
            const amount = interaction.options.getInteger('delta', true);
            const reason = interaction.options.getString('reason', true);
            if (amount === 0) {
                await interaction.reply({ flags: MessageFlagsBitField.Flags.Ephemeral, content: 'No change made - amount is 0.' });
                return;
            }
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user, data);
            dbUser.banCounterAbandon += amount;
            if (dbUser.banCounterAbandon < 0) {
                dbUser.banCounterAbandon = 0;
            }
            await updateUser(dbUser, data);
            await createActionUser(
                amount > 0 ? Actions.Cooldown : Actions.ReverseCooldown,
                interaction.user.id,
                dbUser.id,
                reason,
                'Abandon (CD) counter changed'
            );
            if (
                interaction.channel?.type === ChannelType.PublicThread ||
                interaction.channel?.type === ChannelType.PrivateThread ||
                interaction.channel?.type === ChannelType.AnnouncementThread
            ) {
                await interaction.reply({ content: `<${dbUser.id}> abandon (CD) counter changed by ${amount}. New counter: ${dbUser.banCounterAbandon}` });
            } else {
                await interaction.reply({ content: `<@${dbUser.id}> abandon (CD) counter changed by ${amount}. New counter: ${dbUser.banCounterAbandon}` });
            }

            try {
                let dmChannel: DMChannel;
                if (!user.dmChannel) {
                    dmChannel = await user.createDM(true);
                } else {
                    dmChannel = user.dmChannel;
                }

                await dmChannel.send({ content: `You have received the following counter change (CD) by: \`${amount}\`` });
            } catch (e) {
                await interaction.followUp({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "Failed to send dm" });
            }

            //log the cmd
            let logMessage = `<@${interaction.user.id}> adjusted abandon cd counter for <@${user.id}> by ${amount}. New counter is ${dbUser.banCounterAbandon}, Reason:${reason}.`;
            let modAction = `${interaction.user.displayName} used change_abandon_cd_counter`;
            await logSMMInfo(logMessage, interaction.client, modAction);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'change_abandon_cd_counter',
    allowedRoles: tokens.Mods,
} 
