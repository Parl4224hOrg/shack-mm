import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {MessageFlagsBitField} from "discord.js";
import {logError} from "../loggers";
import {getUserByUser} from "../modules/getters/getUser";
import {ntfySubscribeUrl} from "../modules/ntfy";

export const ntfy: Command = {
    data: new SlashCommandBuilder()
        .setName("ntfy")
        .setDescription("Get your ntfy topic URL for match-found notifications"),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const url = ntfySubscribeUrl(dbUser.ntfyId);
            await interaction.reply({
                flags: MessageFlagsBitField.Flags.Ephemeral,
                content: `Subscribe to this topic in the ntfy app to get match-found notifications:\n${url}`,
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "ntfy",
};
