import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";

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
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 're-ready-button',
}