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
            const updateGame = await GameModel.findOne({ matchId: updateGameId, scoreB: { "$gte": 0 }, scoreA: { '$gte': 0 } });
            if (!updateGame) {
                await interaction.followUp({ ephemeral: true, content: 'Game not found.' });
            } else {
                // Update the game with new scores
                updateGame.scoreA = teamAScore;
                updateGame.scoreB = teamBScore;
                await updateGame.save();
                const channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
                const embed = new EmbedBuilder();
                embed.setTitle(`Game ${updateGameId} has been updated`);
                embed.setDescription(`Team A score now: ${teamAScore} and Team B score now: ${teamBScore} updated by <@${interaction.user.id}> because: ${reason}`);
                await channel.send({embeds: [embed.toJSON()]});
                await interaction.followUp({ephemeral: true, content: 'done'});
            }
        } catch (e) {
            await logError(e, interaction);
        }
        return undefined;
    },
    name: 'update_match_score',
    allowedRoles: tokens.Mods,
};
