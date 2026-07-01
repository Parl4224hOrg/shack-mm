import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField, TextChannel} from "discord.js";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import tokens from "../../tokens";

export const autoReady: Button = {
    data: new ButtonBuilder()
        .setLabel("Auto Ready")
        .setStyle(ButtonStyle.Primary)
        .setCustomId('re-ready-button'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const game = data.findGame(dbUser._id);
            if (!game) {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Could not find game"});
            } else {
                const result = game.requeue(dbUser);
                if (result) {
                    await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "You have been set to be re readied at the end of the game"});
                } else {
                    await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "You will no longer be re readied at the end of the game"});
                }
                const gameLogChannel = await interaction.client.channels.fetch(tokens.GameLogChannel) as TextChannel;
                await gameLogChannel.send({
                    content: `<@${interaction.user.id}> | ${interaction.user.id} | ${interaction.user.username}\n` +
                        `${result ? "added to" : "removed from"} the re-ready list | match: ${game.matchNumber}`,
                    allowedMentions: {users: []}
                });
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 're-ready-button',
}
