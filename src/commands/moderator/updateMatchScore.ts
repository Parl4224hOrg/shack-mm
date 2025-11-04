import { MessageFlagsBitField } from "discord.js";
import { Command } from "../../interfaces/Command";
import { SlashCommandBuilder } from "@discordjs/builders";
import { logError, logSMMInfo } from "../../loggers";
import GameModel from "../../database/models/GameModel";
import tokens from "../../tokens";


export const updateMatchScore: Command = {
    data: new SlashCommandBuilder()
        .setName('update_match_score')
        .setDescription('Updates a game with the supplied team scores')
        .addIntegerOption(option =>
            option.setName('game_id')
                .setDescription('ID of the game to update')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('team_a_score')
                .setDescription('Score of team A')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('team_b_score')
                .setDescription('Score of team B')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the update')
                .setRequired(true)),
    run: async (interaction) => {
        try {
            await interaction.deferReply();
            let reason = interaction.options.getString('reason', true);
            const updateGameId = interaction.options.getInteger('game_id', true);
            const teamAScore = interaction.options.getInteger('team_a_score', true);
            const teamBScore = interaction.options.getInteger('team_b_score', true);

            // Find the game
            const updateGame = await GameModel.findOne({ matchId: updateGameId });
            if (!updateGame) {
                await interaction.followUp({ flags: MessageFlagsBitField.Flags.Ephemeral, content: 'Game not found.' });
            } else {
                const oldScoreA = updateGame.scoreA;
                const oldScoreB = updateGame.scoreB;
                const oldAbandoned = updateGame.abandoned;
                let endDateChanged = false;

                if (teamAScore !== 10 && teamBScore !== 10) {
                    await interaction.followUp({ flags: MessageFlagsBitField.Flags.Ephemeral, content: 'One team must have scored 10.' });
                } else if (teamAScore === 10 && teamBScore === 10) {
                    await interaction.followUp({ flags: MessageFlagsBitField.Flags.Ephemeral, content: 'Both teams can\'t get 10.' });
                } else {
                    // Update the game with new scores
                    updateGame.scoreA = teamAScore;
                    updateGame.scoreB = teamBScore;
                    updateGame.winner = teamAScore === 10 ? 0 : 1;
                    if (updateGame.endDate < 0) {
                        // Set endDate to be 40 minutes from creationDate
                        updateGame.endDate = updateGame.creationDate + 40 * 60;
                        endDateChanged = true;
                    }
                    updateGame.abandoned = false;
                    await updateGame.save();
                    let followUpMessage = `Game ${updateGameId} has been updated:\n- Team A score: ${teamAScore}\n- Team B score: ${teamBScore}\n- Winner: ${updateGame.winner === 0 ? 'Team A' : 'Team B'}\n- Reason: ${reason}`;
                    if (endDateChanged) {
                        followUpMessage += `\n- End date set to 40 minutes from creation date`;
                    }
                    await interaction.followUp({
                        flags: MessageFlagsBitField.Flags.Ephemeral,
                        content: followUpMessage
                    });
                }
            }

            //log the cmd
            let logMessage = `<@${interaction.user.id}> updated game ${updateGameId} to TeamA: ${teamAScore} TeamB: ${teamBScore}. Reason: ${reason}.`;
            let modAction = `${interaction.user.displayName} used update_match_score`;
            await logSMMInfo(logMessage, interaction.client, modAction);
        } catch (e) {
            await logError(e, interaction);
        }
        return undefined;
    },
    name: 'update_match_score',
    allowedRoles: tokens.Mods,
};
