import { Command } from "../../interfaces/Command";
import { SlashCommandBuilder } from "discord.js";
import { userOption } from "../../utility/options";
import tokens from "../../tokens";
import { logError } from "../../loggers";
import { getUserByUser } from "../../modules/getters/getUser";
import { updateUser } from "../../modules/updaters/updateUser";
import {Client, EmbedBuilder, TextChannel} from "discord.js";
import moment from "moment";

export const recalc: Command = {
    data: new SlashCommandBuilder()
        .setName('recalc')
        .setDescription("Unmutes a player")
        .addUserOption(userOption("User to unmute")),
    run: async (interaction, data) => {
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
