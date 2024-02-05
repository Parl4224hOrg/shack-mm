import {SubCommand} from "../../interfaces/Command";
import {reason} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {createAction} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import {SlashCommandSubcommandBuilder} from "discord.js";

export const nullify: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('nullify')
        .setDescription('Nullifies a match')
        .addStringOption(reason),
    run: async (interaction, data) => {
        try {
            const game = data.getGameByChannel(interaction.channelId);
            if (!game) {
                await interaction.reply({ephemeral: true, content: 'Could not find game'});
            } else {
                await interaction.reply("game nullified");
                await game.abandonCleanup(true);
                await createAction(Actions.Nullify, interaction.user.id, interaction.options.getString('reason', true), `Game ${game.id} nullified`);
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'nullify',
    allowedRoles: tokens.Mods,
}