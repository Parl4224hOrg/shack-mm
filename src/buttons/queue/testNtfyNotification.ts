import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {postNtfyNotification} from "../../modules/ntfy";
import tokens from "../../tokens";

export const testNtfyNotificationButton: Button = {
    data: new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Test NTFY")
        .setCustomId("test-ntfy-notification-button"),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            await postNtfyNotification(
                dbUser.ntfyId,
                "This should link to snd-queue",
                `https://discord.com/channels/${tokens.GuildID}/${tokens.SNDChannel}`,
                "default",
                "NTFY Test",
            );
            await interaction.reply({
                flags: MessageFlagsBitField.Flags.Ephemeral,
                content: "Test ntfy notification sent.",
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "test-ntfy-notification-button",
};
