import {SubCommand} from "../../interfaces/Command";
import {reason} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {createAction} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {Client, EmbedBuilder, TextChannel} from "discord.js";

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
                await interaction.reply({ephemeral: true, content: 'Could not find game'});
            } else {
                await interaction.reply("game nullified");
                await game.abandonCleanup(true);
                const channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
                const embed = new EmbedBuilder();
                embed.setTitle(`Game ${game.id} nullified`);
                embed.setDescription(`Game ${game.id} nullified by <@${interaction.user.id}> because: ${reason}`);
                await channel.send({embeds: [embed.toJSON()]});
                await createAction(Actions.Nullify, interaction.user.id, reason, `Game ${game.id} nullified`);
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'nullify',
    allowedRoles: [tokens.Mods, tokens.Referee]
}
