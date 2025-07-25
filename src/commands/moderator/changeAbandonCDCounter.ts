import {ChannelType, MessageFlagsBitField} from "discord.js";
import { SubCommand } from "../../interfaces/Command";
import { userOption, reason } from "../../utility/options";
import tokens from "../../tokens";
import { logError } from "../../loggers";
import { createActionUser } from "../../modules/constructors/createAction";
import { Actions } from "../../database/models/ActionModel";
import { getUserByUser } from "../../modules/getters/getUser";
import { updateUser } from "../../modules/updaters/updateUser";
import { SlashCommandSubcommandBuilder, SlashCommandIntegerOption } from "discord.js";
import { EmbedBuilder, TextChannel } from "discord.js";

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
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
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
            const channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
            const embed = new EmbedBuilder();
            embed.setTitle(`User ${dbUser.id} abandon (CD) counter changed`);
            embed.setDescription(`<@${dbUser.id}> abandon (CD) counter changed by <@${interaction.user.id}> by ${amount}. Reason: ${reason}`);
            await channel.send({ embeds: [embed.toJSON()] });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'change_abandon_cd_counter',
    allowedRoles: tokens.Mods,
} 
