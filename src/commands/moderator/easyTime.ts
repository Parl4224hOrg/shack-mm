import { SubCommand } from "../../interfaces/Command";
import {MessageFlagsBitField, SlashCommandSubcommandBuilder} from "discord.js";
import { userOption } from "../../utility/options";
import { logError } from "../../loggers";
import tokens from "../../tokens";

export const easyTime: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('easy_time')
        .setDescription("Sends a message to join with a built in discord timestamp")
        .addUserOption(userOption("User to mention in message")),
    run: async (interaction, data) => {
        try {
            const game = data.getGameByChannel(interaction.channelId);
            const user = interaction.options.getUser('user', true);
            if (!game) {
                await interaction.reply({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "use in a match channel" });
            } else {
                const timestamp = game.finalGenTime + 10 * 60;
                await interaction.reply({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "easy_time is working" });
                await interaction.followUp({
                    content: `<@${user.id}> <t:${timestamp}:R> you will be abandoned if you do not join the game`
                });
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'easy_time',
    allowedRoles: tokens.Mods
}
