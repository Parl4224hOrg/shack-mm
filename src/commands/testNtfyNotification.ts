import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {MessageFlagsBitField} from "discord.js";
import {logError} from "../loggers";
import {getUserByUser} from "../modules/getters/getUser";
import {postNtfyNotification} from "../modules/ntfy";
import tokens from "../tokens";

export const testNtfyNotification: Command = {
    data: new SlashCommandBuilder()
        .setName("test_ntfy_notification")
        .setDescription("Send yourself a test ntfy notification"),
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
    name: "test_ntfy_notification",
};
