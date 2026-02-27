import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {MessageFlagsBitField} from "discord.js";
import {logError} from "../../loggers";
import {userOption} from "../../utility/options";
import tokens from "../../tokens";

export const removePingMe: Command = {
    data: new SlashCommandBuilder()
        .setName("remove_ping_me")
        .setDescription("Removes a ping me")
        .addUserOption(userOption("User to remove ping me from")),
    run: async (interaction, data) => {
        try {
            const user = interaction.options.getUser('user', true);
            await data.addPingMe("SND", "FILL", user, 8, 0);
            await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: `Removed Ping Me for <@${user.id}>`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'remove_ping_me',
    allowedRoles: tokens.Mods,
}