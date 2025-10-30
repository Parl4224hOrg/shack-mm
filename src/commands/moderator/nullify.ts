import { SubCommand } from "../../interfaces/Command";
import { reason } from "../../utility/options";
import tokens from "../../tokens";
import { logError, logModInfo } from "../../loggers";
import { createAction } from "../../modules/constructors/createAction";
import { Actions } from "../../database/models/ActionModel";
import { MessageFlagsBitField, SlashCommandSubcommandBuilder } from "discord.js";
import { EmbedBuilder, TextChannel } from "discord.js";

export const nullify: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('nullify')
        .setDescription('Nullifies a match')
        .addStringOption(reason),
    run: async (interaction, data) => {
        try {
            // Check if the command was run under /ref or /mod
            const isReferee = interaction.commandName === 'ref';
            let reason = interaction.options.getString('reason', true);
            const game = data.getGameByChannel(interaction.channelId);
            if (!game) {
                await interaction.reply({ flags: MessageFlagsBitField.Flags.Ephemeral, content: 'Could not find game' });
            } else {
                await interaction.reply({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "nullify is working" });
                if (interaction.channel && interaction.channel.isSendable()) {
                    await interaction.channel.send({
                        content: "game nullified",
                    })
                } else {
                    await interaction.followUp({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "cannot send message, command executed" });
                }
                await game.abandonCleanup(true, data.getQueue().getDeleteQueue());
                await createAction(Actions.Nullify, interaction.user.id, reason, `Game ${game.id} nullified`);
                let channel: TextChannel;
                if (isReferee) {
                    channel = await interaction.client.channels.fetch(tokens.RefereeLogChannel) as TextChannel;
                } else {
                    channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
                }
                const embed = new EmbedBuilder();
                embed.setTitle(`Game ${game.id} nullified`);
                embed.setDescription(`Game ${game.id} nullified by <@${interaction.user.id}> because: ${reason}`);
                await channel.send({ embeds: [embed.toJSON()] });
            }

            //log the cmd
            let logMessage = `<@${interaction.user.id}> nullified game ${game ? game.id : 'N/A'}. Reason: ${reason}.`;
            let modAction = `<@${interaction.user.id}> used nullify`;
            await logModInfo(logMessage, interaction.client, modAction);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'nullify',
    allowedRoles: tokens.Mods
}
