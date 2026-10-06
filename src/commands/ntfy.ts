import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {MessageFlagsBitField} from "discord.js";
import {logError} from "../loggers";
import {getUserByUser} from "../modules/getters/getUser";

export const ntfy: Command = {
    data: new SlashCommandBuilder()
        .setName("ntfy")
        .setDescription("Get your ntfy topic URL for match-found notifications"),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            await interaction.reply({
                flags: MessageFlagsBitField.Flags.Ephemeral,
                content: `Subscribe to this topic in the ntfy app to get match-found notifications:`,
            });
            await interaction.followUp({
                flags: MessageFlagsBitField.Flags.Ephemeral,
                content: dbUser.ntfyId,
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "ntfy",
};
