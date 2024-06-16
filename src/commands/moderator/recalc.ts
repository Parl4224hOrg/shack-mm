import { CommandInteraction } from "discord.js";
import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import {queues} from "../../utility/options";
import GameModel from "../../database/models/GameModel";
import {getUserById} from "../../modules/getters/getUser";
import {processMMR} from "../../utility/processMMR";
import {GameUser} from "../../interfaces/Game";
import {updateGame} from "../../modules/updaters/updateGame";
import tokens from "../../tokens";
import StatsModel from "../../database/models/StatsModel";
import {Regions} from "../../database/models/UserModel";

export const recalc: Command = {
    data: new SlashCommandBuilder()
        .setName('re_calc')
        .setDescription('Re-calculates MMR for a specific game')
        .addIntegerOption(option =>
            option.setName('game_id')
                .setDescription('ID of the game to recalculate')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('team_a_score')
                .setDescription('Score of team A')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('team_b_score')
                .setDescription('Score of team B')
                .setRequired(true)),
    run: async (interaction, data) => {
        try {
            const updateGameId = interaction.options.getInteger('game_id', true);
            const teamAScore = interaction.options.getInteger('team_a_score', true);
            const teamBScore = interaction.options.getInteger('team_b_score', true);

            // Find the game
            const updateGame = await GameModel.findOne({ matchId: updateGameId, scoreB: { "$gte": 0 }, scoreA: { '$gte': 0 } });
            if (!updateGame) {
                await interaction.followUp({ ephemeral: true, content: 'Game not found.' });
            }
            
            // Update the game with new scores
            updateGame.scoreA = teamAScore;
            updateGame.scoreB = teamBScore;
            await game.save();
            await interaction.followUp({ephemeral: true, content: 'done'});
        } catch (e) {
            await logError(e, interaction);
        }
        return undefined;
    },
    name: 'recalc',
    allowedRoles: tokens.Mods,
};
