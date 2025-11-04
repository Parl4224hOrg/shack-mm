import { SubCommand } from "../../interfaces/Command";
import { reason } from "../../utility/options";
import tokens from "../../tokens";
import { logError, logSMMInfo } from "../../loggers";
import { createAction } from "../../modules/constructors/createAction";
import { Actions } from "../../database/models/ActionModel";
import { MessageFlagsBitField, SlashCommandSubcommandBuilder } from "discord.js";

export const nullify: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('nullify')
        .setDescription('Nullifies a match')
        .addStringOption(reason),
    run: async (interaction, data) => {
        try {
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
                
            }

            //log the cmd
            let logMessage = `<@${interaction.user.id}> nullified game ${game ? game.id : 'N/A'}. Reason: ${reason}.`;
            let modAction = `${interaction.user.displayName} used nullify`;
            await logSMMInfo(logMessage, interaction.client, modAction);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'nullify',
    allowedRoles: tokens.Mods
}
