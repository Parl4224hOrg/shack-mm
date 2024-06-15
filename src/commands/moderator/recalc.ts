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
    run: async (interaction: CommandInteraction, data) => {
        try {
            await interaction.deferReply({ephemeral: true});
            
            const updateGameId = interaction.options.getInteger('game_id', true);
            const teamAScore = interaction.options.getInteger('team_a_score', true);
            const teamBScore = interaction.options.getInteger('team_b_score', true);

            // Validation check
            if (!((teamAScore === 10 && teamBScore >= 0 && teamBScore <= 9) || (teamBScore === 10 && teamAScore >= 0 && teamAScore <= 9))) {
                return await interaction.followUp({ ephemeral: true, content: 'Invalid scores. One score must be 10, and the other must be between 0 and 9.' });
            }

            // Find the game
            const updateGame = await GameModel.findOne({ matchId: updateGameId, scoreB: { "$gte": 0 }, scoreA: { '$gte': 0 } });
            if (!updateGame) {
                return await interaction.followUp({ ephemeral: true, content: 'Game not found.' });
            }
            
            // Update the game with new scores
            updateGame.scoreA = teamAScore;
            updateGame.scoreB = teamBScore;
            await game.save();
            
            const games = await GameModel.find({scoreB: {"$gte": 0}, scoreA: {'$gte': 0}}).sort({matchId: 1});
            await StatsModel.deleteMany({queueId: "SND"})
            for (let game of games) {
                let teamA = [];
                let teamB = [];
                let users: GameUser[] = [];
                for (let player of game.teamA) {
                    const user = await getUserById(player, data)
                    users.push({
                        dbId: player,
                        discordId: user.id,
                        team: 0,
                        accepted: true,
                        region: Regions.APAC,
                        joined: false,
                    })
                    teamA.push(user);
                }
                for (let player of game.teamB) {
                    const user = await getUserById(player, data)
                    users.push({
                        dbId: player,
                        discordId: user.id,
                        team: 1,
                        accepted: true,
                        region: Regions.APAC,
                        joined: false,
                    })
                    teamB.push(user);
                }
                const results = await processMMR(users, [game.scoreA, game.scoreB], "SND", 10);
                game.teamAChanges = results[0];
                game.teamBChanges = results[1];
                await updateGame(game);
            }
            await interaction.followUp({ephemeral: true, content: 'done'});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'recalc',
    allowedRoles: [tokens.Mods],
};
