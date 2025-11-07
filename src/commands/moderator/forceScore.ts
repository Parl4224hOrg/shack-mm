import {SubCommand} from "../../interfaces/Command";
import {reason, score} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {createAction} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import {MessageFlagsBitField, SlashCommandSubcommandBuilder} from "discord.js";

export const forceScore: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('force_score')
        .setDescription('Force submit scores for a match')
        .addIntegerOption(score('team_a'))
        .addIntegerOption(score('team_b'))
        .addStringOption(reason),
    run: async (interaction, data) => {
        try {
            const game = data.getGameByChannel(interaction.channelId);
            if (!game) {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: 'Could not find game'});
            } else {
                const response = game.forceScore(interaction.options.getInteger('team_a', true), interaction.options.getInteger('team_b', true));
                await interaction.reply({flags: response.flags, content: response.message});
                if (response.success) {
                    await createAction(Actions.ForceScore, interaction.user.id, interaction.options.getString('reason', true), response.message);
                }
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'force_score',
    allowedRoles: tokens.Mods,
}