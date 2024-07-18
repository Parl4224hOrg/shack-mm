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
import {Client, EmbedBuilder, TextChannel} from "discord.js";


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
    run: async (interaction, data) => {
        try {
            await interaction.deferReply();
            let reason = interaction.options.getString('reason', true);
            const updateGameId = interaction.options.getInteger('game_id', true);
            const teamAScore = interaction.options.getInteger('team_a_score', true);
            const teamBScore = interaction.options.getInteger('team_b_score', true);

            // Find the game
            const updateGame = await GameModel.findOne({ matchId: updateGameId });
            if (!updateGame) {
                await interaction.followUp({ ephemeral: true, content: 'Game not found.' });
            } else {
                const oldScoreA = updateGame.scoreA;
                const oldScoreB = updateGame.scoreB;
                const oldAbandoned = updateGame.abandoned;
                
                if (teamAScore !== 10 && teamBScore !== 10) {
                    await interaction.followUp({ ephemeral: true, content: 'One team must have scored 10.' });
                } else if (teamAScore === 10 && teamBScore === 10) {
                    await interaction.followUp({ ephemeral: true, content: 'Both teams can\'t get 10.' });
                } else {
                    // Update the game with new scores
                    updateGame.scoreA = teamAScore;
                    updateGame.scoreB = teamBScore;
                    updateGame.winner = teamAScore === 10 ? 0 : 1;
                    if(updateGame.endDate < 0) {
                        // Set endDate to be 40 minutes from creationDate
                        updateGame.endDate = updateGame.creationDate + 40 * 60;
                    }
                    updateGame.abandoned = false;
                    await updateGame.save();
                    const channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
                    const embed = new EmbedBuilder();
                    embed.setTitle(`Game ${updateGameId} has been updated`);
                    embed.setDescription(`Team A score now: ${teamAScore} and Team B score now: ${teamBScore} updated by <@${interaction.user.id}> because: ${reason}\nOld team A score: ${oldScoreA} and old team B score: ${oldScoreB}\nMatch was previously abandoned: ${oldAbandoned}`);
                    await channel.send({embeds: [embed.toJSON()]});
                    await interaction.followUp({
                        ephemeral: true,
                        content: `Game ${updateGameId} has been updated:\n- Team A score: ${teamAScore}\n- Team B score: ${teamBScore}\n- Winner: ${updateGame.winner === 0 ? 'Team A' : 'Team B'}\n- End date set to 40 minutes from creation date\n- Reason: ${reason}`
                    });                
                }
            }
        } catch (e) {
            await logError(e, interaction);
        }
        return undefined;
    },
    name: 'update_match_score',
    allowedRoles: tokens.Mods,
};
