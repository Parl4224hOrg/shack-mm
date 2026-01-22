import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import gameModel from "../../database/models/GameModel";
import {getMapRadarChart, getMapsDB} from "../../utility/match";

export const testWinrate: Command = {
    data: new SlashCommandBuilder()
        .setName('test-winrate')
        .setDescription("Tests the winrate radar chart"),
    run: async (interaction) => {
        try {
            const latestGame = await gameModel.findOne({})
                .sort({MatchId: -1});

            if (!latestGame) return;

            const maps = await getMapsDB(tokens.VoteSize);
            const chart = await getMapRadarChart(latestGame.teamA, latestGame.teamB, maps.map(map => map.name));

            await interaction.reply({files: [chart]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "test-winrate",
    allowedUsers: [tokens.Parl],
}