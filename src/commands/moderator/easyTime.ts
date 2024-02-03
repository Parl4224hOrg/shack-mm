import {Command, SubCommand} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {SlashCommandStringOption, SlashCommandSubcommandBuilder} from "discord.js";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import tokens from "../../tokens";

export const easyTime: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('easy_time')
        .setDescription("Sends a message to join with a built in discord timestamp")
        .addUserOption(userOption("User to mention in message"))
        .addStringOption(new SlashCommandStringOption()
            .setName('message')
            .setDescription("Message for the user to see default to @user in x you will be abandoned if you do not join the game")
            .setRequired(false)),
    run: async (interaction, data) => {
        try {
            const game = data.getGameByChannel(interaction.channelId);
            const user = interaction.options.getUser('user', true);
            if (!game) {
                await interaction.reply({ephemeral:true, content: "use in a match channel"});
            } else {
                const timestamp = game.finalGenTime + 10 * 60;
                const message = interaction.options.getString('message');
                if (message) {
                    await interaction.reply({ephemeral: false, content: message.replace('{user}', `<@${user.id}>`).replace("{time}", `<t:${timestamp}:R>`)});
                } else {
                    await interaction.reply({ephemeral: false, content: `<@${user.id}> <t:${timestamp}:R> you will be abandoned if you do not join the game`});
                }
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'easy_time',
    allowedRoles: tokens.Mods,
}