import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../../loggers";
import {gameEmbed} from "../../embeds/matchEmbeds";

export const games: Button = {
    data: new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setLabel("Current Games")
        .setCustomId('games-queue'),
    run: async (interaction, data) => {
        try {
            const games = data.getGames();
            const embeds = [];
            for (let game of games) {
                embeds.push(gameEmbed(game));
            }
            await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Current Games:", embeds: embeds});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'games-queue',
}