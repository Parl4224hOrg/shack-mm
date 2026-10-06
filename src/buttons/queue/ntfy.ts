import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {ntfySubscribeUrl} from "../../modules/ntfy";

export const ntfyButton: Button = {
    data: new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Get NTFY")
        .setCustomId("ntfy-button"),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            await interaction.reply({
                flags: MessageFlagsBitField.Flags.Ephemeral,
                content: `Subscribe to this topic in the ntfy app to get match-found notifications:\n${ntfySubscribeUrl(dbUser.ntfyId)}`,
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "ntfy-button",
};
